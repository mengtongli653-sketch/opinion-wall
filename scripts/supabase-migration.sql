-- Run in the existing Supabase project's SQL editor immediately before cutover.
-- This creates new objects only. The original AnonBorad tables are never changed.
-- Re-running this script preserves an already initialized board, including edits.
begin;

create table if not exists public.opinion_wall_state (
  id smallint primary key check (id = 1),
  version bigint not null default 0 check (version >= 0 and version < 9007199254740991),
  state jsonb not null check (
    jsonb_typeof(state) = 'object'
    and state ?& array['meta', 'posts', 'comments', 'blocked_words', 'reactions', 'report_records', 'sections', 'editor_contacts']
    and jsonb_typeof(state -> 'meta') = 'object'
    and jsonb_typeof(state -> 'posts') = 'array'
    and jsonb_typeof(state -> 'comments') = 'array'
    and jsonb_typeof(state -> 'blocked_words') = 'array'
    and jsonb_typeof(state -> 'reactions') = 'array'
    and jsonb_typeof(state -> 'report_records') = 'array'
    and jsonb_typeof(state -> 'sections') = 'array'
    and jsonb_typeof(state -> 'editor_contacts') = 'array'
  ),
  updated_at timestamptz not null default now()
);

alter table public.opinion_wall_state enable row level security;
revoke all on table public.opinion_wall_state from public, anon, authenticated;
grant select, update on table public.opinion_wall_state to service_role;

-- A stale snapshot cannot overwrite a successful concurrent write.
-- SECURITY INVOKER plus grants restrict this RPC to the server service role.
create or replace function public.opinion_wall_compare_and_swap(
  p_expected_version bigint,
  p_state jsonb
) returns boolean
language sql
security invoker
set search_path = ''
as $function$
  with saved as (
    update public.opinion_wall_state
    set state = p_state, version = version + 1, updated_at = now()
    where id = 1 and version = p_expected_version
    returning id
  )
  select exists (select 1 from saved);
$function$;

revoke all on function public.opinion_wall_compare_and_swap(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.opinion_wall_compare_and_swap(bigint, jsonb) to service_role;

do $migration$
declare
  legacy_comments jsonb := '[]';
  legacy_categories jsonb := '[]';
  legacy_words jsonb := '[]';
  legacy_interactions jsonb := '[]';
  posts jsonb := '[]';
  sections jsonb := '[]';
  words jsonb := '[]';
  reactions jsonb := '[]';
  reports jsonb := '[]';
  unmapped_interactions jsonb := '[]';
  category_ids jsonb := '{}';
  normalized_category_ids jsonb := '{}';
  post_ids jsonb := '{}';
  post_times jsonb := '{}';
  seen_words jsonb := '{}';
  seen_interactions jsonb := '{}';
  item jsonb;
  category_name text;
  section_id text;
  original_id text;
  post_id bigint;
  post_seq bigint := 0;
  section_seq bigint := 0;
  word_seq bigint := 0;
  report_seq bigint := 0;
  at_ms bigint;
  imported_ms bigint := floor(extract(epoch from now()) * 1000)::bigint;
  fingerprint text;
  interaction_action text;
  interaction_key text;
  title text;
begin
  -- Serialize concurrent attempts to initialize the new singleton row.
  perform pg_advisory_xact_lock(hashtext('opinion-wall-initial-migration'));
  if exists (select 1 from public.opinion_wall_state where id = 1) then
    return;
  end if;

  -- Read only known content tables, never credentials/admin-password tables.
  -- to_jsonb retains identifiers independent of their UUID/integer SQL type.
  if to_regclass('public.comments') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.comments t' into legacy_comments;
  end if;
  if to_regclass('public.categories') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.categories t' into legacy_categories;
  end if;
  if to_regclass('public.sensitive_words') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.sensitive_words t' into legacy_words;
  end if;
  if to_regclass('public.interactions') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.interactions t' into legacy_interactions;
  end if;

  -- Categories referenced only by old messages are preserved too.
  for category_name in
    select distinct btrim(name)
    from (
      select value ->> 'name' as name from jsonb_array_elements(legacy_categories)
      union all
      select value ->> 'category' as name from jsonb_array_elements(legacy_comments)
    ) names
    where nullif(btrim(name), '') is not null
    order by btrim(name)
  loop
    section_id := normalized_category_ids ->> lower(category_name);
    if section_id is null then
      section_seq := section_seq + 1;
      section_id := 'sec' || section_seq;
      sections := sections || jsonb_build_array(jsonb_build_object(
        'id', section_id, 'name', category_name, 'created_at', imported_ms
      ));
      normalized_category_ids := normalized_category_ids || jsonb_build_object(lower(category_name), section_id);
    end if;
    category_ids := category_ids || jsonb_build_object(category_name, section_id);
  end loop;

  -- In AnonBorad a "comment" is a top-level message. Import it as a published
  -- discussion; new reply comments start empty. Original IDs remain traceable.
  for item in
    select value from jsonb_array_elements(legacy_comments)
    order by value ->> 'created_at', value ->> 'id'
  loop
    original_id := item ->> 'id';
    if nullif(original_id, '') is null or not (item ? 'content') then
      raise exception 'Legacy comments schema is missing id/content; migration aborted without replacing data.';
    end if;
    if post_ids ? original_id then
      raise exception 'Legacy comments contains duplicate identifiers; migration aborted.';
    end if;
    post_seq := post_seq + 1;
    at_ms := case when nullif(item ->> 'created_at', '') is null then imported_ms
      else floor(extract(epoch from (item ->> 'created_at')::timestamptz) * 1000)::bigint end;
    title := left(regexp_replace(btrim(coalesce(item ->> 'content', '')), '[[:space:]]+', ' ', 'g'), 100);
    if title = '' then title := '历史留言'; end if;
    posts := posts || jsonb_build_array(jsonb_build_object(
      'id', post_seq,
      'legacy_id', original_id,
      'legacy_category', item ->> 'category',
      'legacy_is_hidden', coalesce((item ->> 'is_hidden')::boolean, false),
      'legacy_private', coalesce((item ->> 'is_hidden')::boolean, false),
      'title', title,
      'content', coalesce(item ->> 'content', ''),
      'author_tag', '历史匿名留言',
      'display_name', null,
      'tag', category_ids ->> btrim(item ->> 'category'),
      'kind', 'discussion',
      'status', 'published',
      'pinned', 0,
      'featured', 0,
      'likes', greatest(0, coalesce((item ->> 'likes')::bigint, 0)),
      'reports', greatest(0, coalesce((item ->> 'reports')::bigint, 0)),
      'visibility', case when coalesce((item ->> 'is_hidden')::boolean, false) then 'hidden' else 'auto' end,
      'created_at', at_ms
    ));
    post_ids := post_ids || jsonb_build_object(original_id, post_seq);
    post_times := post_times || jsonb_build_object(original_id, at_ms);
  end loop;

  for item in select value from jsonb_array_elements(legacy_words) order by value ->> 'word'
  loop
    if nullif(btrim(item ->> 'word'), '') is not null and not (seen_words ? lower(btrim(item ->> 'word'))) then
      word_seq := word_seq + 1;
      words := words || jsonb_build_array(jsonb_build_object('id', word_seq, 'word', btrim(item ->> 'word')));
      seen_words := seen_words || jsonb_build_object(lower(btrim(item ->> 'word')), true);
    end if;
  end loop;

  -- Old browser fingerprints cannot identify a new session cookie. Prefix
  -- them to preserve historical reactions without impersonating new visitors.
  -- Deduplicate old rows as the new app allows one reaction/report per reader.
  -- Totals on each message remain the original counters, without recounting.
  for item in select value from jsonb_array_elements(legacy_interactions) order by value ->> 'created_at', value ->> 'id'
  loop
    original_id := item ->> 'comment_id';
    post_id := (post_ids ->> original_id)::bigint;
    fingerprint := nullif(item ->> 'user_fingerprint', '');
    interaction_action := item ->> 'action';
    if post_id is null or fingerprint is null or interaction_action is null or interaction_action not in ('like', 'report') then
      -- Keep unexpected/orphan records in the protected state as well as their
      -- untouched original table, rather than inventing a target or identity.
      unmapped_interactions := unmapped_interactions || jsonb_build_array(item);
      continue;
    end if;
    interaction_key := jsonb_build_array(original_id, fingerprint, interaction_action)::text;
    if seen_interactions ? interaction_key then continue; end if;
    seen_interactions := seen_interactions || jsonb_build_object(interaction_key, true);
    at_ms := case when nullif(item ->> 'created_at', '') is null then (post_times ->> original_id)::bigint
      else floor(extract(epoch from (item ->> 'created_at')::timestamptz) * 1000)::bigint end;
    if interaction_action = 'like' then
      reactions := reactions || jsonb_build_array(jsonb_build_object(
        'anon_id', 'legacy:' || fingerprint, 'target_type', 'post',
        'target_id', post_id, 'kind', 'like', 'created_at', at_ms
      ));
    else
      report_seq := report_seq + 1;
      reports := reports || jsonb_build_array(jsonb_build_object(
        'id', report_seq, 'anon_id', 'legacy:' || fingerprint,
        'target_type', 'post', 'target_id', post_id, 'category', 'other',
        'reason', '旧版举报（未记录原因）', 'created_at', at_ms, 'resolved', false
      ));
    end if;
  end loop;

  insert into public.opinion_wall_state (id, version, state)
  values (1, 0, jsonb_build_object(
    'meta', jsonb_build_object(
      'post_seq', post_seq, 'comment_seq', 0, 'word_seq', word_seq,
      'report_seq', report_seq, 'section_seq', section_seq, 'editor_contact_seq', 0,
      'legacy_source', 'AnonBorad', 'legacy_imported_at', imported_ms,
      'legacy_imported_ids', (select coalesce(jsonb_agg(key), '[]'::jsonb) from jsonb_object_keys(post_ids) as ids(key))
    ),
    'posts', posts, 'comments', '[]'::jsonb, 'blocked_words', words,
    'reactions', reactions, 'report_records', reports, 'sections', sections,
    'editor_contacts', '[]'::jsonb, 'legacy_unmapped_interactions', unmapped_interactions
  ));
end;
$migration$;

commit;

-- Safe verification output: counts only, no content or credentials.
select version,
  jsonb_array_length(state -> 'posts') as imported_messages,
  (select count(*) from jsonb_array_elements(state -> 'posts') as posts(post) where coalesce(post ->> 'status', 'published') = 'published' and not coalesce((post ->> 'legacy_private')::boolean, false)) as public_messages,
  (select count(*) from jsonb_array_elements(state -> 'posts') as posts(post) where coalesce((post ->> 'legacy_private')::boolean, false)) as private_messages,
  (select count(*) from jsonb_array_elements(state -> 'posts') as posts(post) where coalesce(post ->> 'status', 'published') <> 'published' and not coalesce((post ->> 'legacy_private')::boolean, false)) as pending_messages,
  jsonb_array_length(state -> 'sections') as sections,
  jsonb_array_length(state -> 'blocked_words') as blocked_words,
  jsonb_array_length(state -> 'reactions') as historical_likes,
  jsonb_array_length(state -> 'report_records') as historical_reports,
  jsonb_array_length(coalesce(state -> 'legacy_unmapped_interactions', '[]'::jsonb)) as preserved_unmapped_interactions
from public.opinion_wall_state where id = 1;
