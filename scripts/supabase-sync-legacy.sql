-- Run near/after production promotion to capture old-site messages submitted
-- after initial migration. Safe to repeat: imports only never-imported IDs.
-- Existing edits, moderation, counters, and deletions are preserved. Legacy
-- tables remain unchanged. This script does not reimport blocked-word lists.
begin;

do $sync$
declare
  current_state jsonb;
  current_version bigint;
  legacy_comments jsonb := '[]';
  legacy_interactions jsonb := '[]';
  posts jsonb;
  sections jsonb;
  reactions jsonb;
  reports jsonb;
  unmapped_interactions jsonb;
  known_ids jsonb := '{}';
  new_post_ids jsonb := '{}';
  new_post_times jsonb := '{}';
  section_ids jsonb := '{}';
  seen_interactions jsonb := '{}';
  item jsonb;
  original_id text;
  category_name text;
  section_id text;
  post_id bigint;
  post_seq bigint;
  section_seq bigint;
  report_seq bigint;
  at_ms bigint;
  imported_ms bigint := floor(extract(epoch from now()) * 1000)::bigint;
  fingerprint text;
  interaction_action text;
  interaction_key text;
  title text;
  added_count bigint := 0;
begin
  -- Lock the current version while reading and applying the additive import.
  -- App CAS writes waiting behind this lock will retry against the new version.
  select state, version into current_state, current_version
    from public.opinion_wall_state where id = 1 for update;
  if not found then
    raise exception 'Initialize storage with supabase-migration.sql before syncing.';
  end if;

  posts := current_state -> 'posts';
  sections := current_state -> 'sections';
  reactions := current_state -> 'reactions';
  reports := current_state -> 'report_records';
  unmapped_interactions := coalesce(current_state -> 'legacy_unmapped_interactions', '[]'::jsonb);
  post_seq := (current_state -> 'meta' ->> 'post_seq')::bigint;
  section_seq := (current_state -> 'meta' ->> 'section_seq')::bigint;
  report_seq := (current_state -> 'meta' ->> 'report_seq')::bigint;

  -- The registry includes tombstones recorded when editors delete old messages.
  for original_id in select value from jsonb_array_elements_text(coalesce(current_state -> 'meta' -> 'legacy_imported_ids', '[]'::jsonb))
  loop
    known_ids := known_ids || jsonb_build_object(original_id, true);
  end loop;
  for item in select value from jsonb_array_elements(posts)
  loop
    if item ->> 'legacy_id' is not null then
      known_ids := known_ids || jsonb_build_object(item ->> 'legacy_id', true);
    end if;
  end loop;
  for item in select value from jsonb_array_elements(sections)
  loop
    section_ids := section_ids || jsonb_build_object(lower(btrim(item ->> 'name')), item ->> 'id');
  end loop;

  if to_regclass('public.comments') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.comments t' into legacy_comments;
  end if;
  if to_regclass('public.interactions') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.interactions t' into legacy_interactions;
  end if;

  for item in select value from jsonb_array_elements(legacy_comments) order by value ->> 'created_at', value ->> 'id'
  loop
    original_id := item ->> 'id';
    if nullif(original_id, '') is null or not (item ? 'content') then
      raise exception 'Legacy comments schema is missing id/content; sync aborted without replacing data.';
    end if;
    if known_ids ? original_id then continue; end if;

    category_name := nullif(btrim(item ->> 'category'), '');
    section_id := section_ids ->> lower(category_name);
    if category_name is not null and section_id is null then
      section_seq := section_seq + 1;
      section_id := 'sec' || section_seq;
      sections := sections || jsonb_build_array(jsonb_build_object('id', section_id, 'name', category_name, 'created_at', imported_ms));
      section_ids := section_ids || jsonb_build_object(lower(category_name), section_id);
    end if;

    post_seq := post_seq + 1;
    at_ms := case when nullif(item ->> 'created_at', '') is null then imported_ms
      else floor(extract(epoch from (item ->> 'created_at')::timestamptz) * 1000)::bigint end;
    title := left(regexp_replace(btrim(coalesce(item ->> 'content', '')), '[[:space:]]+', ' ', 'g'), 100);
    if title = '' then title := '历史留言'; end if;
    posts := posts || jsonb_build_array(jsonb_build_object(
      'id', post_seq, 'legacy_id', original_id, 'legacy_category', item ->> 'category',
      'legacy_is_hidden', coalesce((item ->> 'is_hidden')::boolean, false),
      'legacy_private', coalesce((item ->> 'is_hidden')::boolean, false),
      'title', title, 'content', coalesce(item ->> 'content', ''),
      'author_tag', '历史匿名留言', 'display_name', null, 'tag', section_id,
      'kind', 'discussion', 'status', 'published', 'pinned', 0, 'featured', 0,
      'likes', greatest(0, coalesce((item ->> 'likes')::bigint, 0)),
      'reports', greatest(0, coalesce((item ->> 'reports')::bigint, 0)),
      'visibility', case when coalesce((item ->> 'is_hidden')::boolean, false) then 'hidden' else 'auto' end,
      'created_at', at_ms
    ));
    new_post_ids := new_post_ids || jsonb_build_object(original_id, post_seq);
    new_post_times := new_post_times || jsonb_build_object(original_id, at_ms);
    known_ids := known_ids || jsonb_build_object(original_id, true);
    added_count := added_count + 1;
  end loop;

  if added_count = 0 then return; end if;

  -- Import interactions only for the newly copied messages. Recounting or
  -- changing reactions on existing messages would overwrite new-site edits.
  for item in select value from jsonb_array_elements(legacy_interactions) order by value ->> 'created_at', value ->> 'id'
  loop
    original_id := item ->> 'comment_id';
    post_id := (new_post_ids ->> original_id)::bigint;
    if post_id is null then continue; end if;
    fingerprint := nullif(item ->> 'user_fingerprint', '');
    interaction_action := item ->> 'action';
    if fingerprint is null or interaction_action is null or interaction_action not in ('like', 'report') then
      unmapped_interactions := unmapped_interactions || jsonb_build_array(item);
      continue;
    end if;
    interaction_key := jsonb_build_array(original_id, fingerprint, interaction_action)::text;
    if seen_interactions ? interaction_key then continue; end if;
    seen_interactions := seen_interactions || jsonb_build_object(interaction_key, true);
    at_ms := case when nullif(item ->> 'created_at', '') is null then (new_post_times ->> original_id)::bigint
      else floor(extract(epoch from (item ->> 'created_at')::timestamptz) * 1000)::bigint end;
    if interaction_action = 'like' then
      reactions := reactions || jsonb_build_array(jsonb_build_object(
        'anon_id', 'legacy:' || fingerprint, 'target_type', 'post', 'target_id', post_id, 'kind', 'like', 'created_at', at_ms
      ));
    else
      report_seq := report_seq + 1;
      reports := reports || jsonb_build_array(jsonb_build_object(
        'id', report_seq, 'anon_id', 'legacy:' || fingerprint, 'target_type', 'post', 'target_id', post_id,
        'category', 'other', 'reason', '旧版举报（未记录原因）', 'created_at', at_ms, 'resolved', false
      ));
    end if;
  end loop;

  current_state := current_state || jsonb_build_object(
    'posts', posts, 'sections', sections, 'reactions', reactions,
    'report_records', reports, 'legacy_unmapped_interactions', unmapped_interactions,
    'meta', (current_state -> 'meta') || jsonb_build_object(
      'post_seq', post_seq, 'section_seq', section_seq, 'report_seq', report_seq,
      'legacy_last_sync_at', imported_ms,
      'legacy_imported_ids', (select coalesce(jsonb_agg(key order by key), '[]'::jsonb) from jsonb_object_keys(known_ids) as ids(key))
    )
  );
  update public.opinion_wall_state
    set state = current_state, version = current_version + 1, updated_at = now()
    where id = 1;
end;
$sync$;

commit;

-- Counts only; never display stored content, private messages, or credentials.
select version,
  jsonb_array_length(state -> 'posts') as total_messages,
  (select count(*) from jsonb_array_elements(state -> 'posts') as posts(post) where coalesce(post ->> 'status', 'published') = 'published' and not coalesce((post ->> 'legacy_private')::boolean, false)) as public_messages,
  (select count(*) from jsonb_array_elements(state -> 'posts') as posts(post) where coalesce((post ->> 'legacy_private')::boolean, false)) as private_messages,
  (select count(*) from jsonb_array_elements(state -> 'posts') as posts(post) where coalesce(post ->> 'status', 'published') <> 'published' and not coalesce((post ->> 'legacy_private')::boolean, false)) as pending_messages,
  state -> 'meta' ->> 'legacy_last_sync_at' as last_additive_sync
from public.opinion_wall_state where id = 1;
