import ExcelJS from 'exceljs';
import { getState } from './db';
import { effectiveVisibility } from './moderation';
import { formatFull } from './time';
import { makeT } from './i18n';

const CATEGORY_KEY = {
  spam: 'report.cat.spam',
  attack: 'report.cat.attack',
  illegal: 'report.cat.illegal',
  misinfo: 'report.cat.misinfo',
  nsfw: 'report.cat.nsfw',
  other: 'report.cat.other',
};

function boolText(t, v) {
  return v ? t('export.yes') : t('export.no');
}

function visibilityText(t, raw, effective) {
  const labelMap = {
    auto: t('admin.menu.visAuto'),
    shown: t('admin.menu.visShown'),
    hidden: t('admin.menu.visHidden'),
  };
  const tag = labelMap[raw || 'auto'] || raw;
  return effective === 'hidden' ? `${tag} → ${t('export.effHidden')}` : `${tag} → ${t('export.effShown')}`;
}

function autoSizeColumns(sheet) {
  sheet.columns.forEach((col) => {
    let max = col.header ? String(col.header).length : 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value;
      if (v == null) return;
      const len = String(v).split('\n').reduce((m, line) => Math.max(m, line.length), 0);
      if (len > max) max = len;
    });
    // CJK characters render wider — give some padding
    col.width = Math.min(80, Math.max(8, max + 2));
  });
}

function styleHeader(sheet) {
  const row = sheet.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  row.alignment = { vertical: 'middle' };
  row.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function buildExportWorkbook({ locale = 'zh' } = {}) {
  const t = makeT(locale);
  const s = getState();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CWA Opinion Wall';
  wb.created = new Date();

  // -------- Summary sheet (first tab) --------
  const summary = wb.addWorksheet(t('export.sheet.summary'), {
    properties: { tabColor: { argb: 'FF2563EB' } },
  });
  summary.columns = [
    { header: t('export.col.metric'), key: 'k', width: 28 },
    { header: t('export.col.value'),  key: 'v', width: 28 },
  ];
  styleHeader(summary);
  // (rows added after we know counts — done at end)

  // -------- Posts sheet --------
  const postsSheet = wb.addWorksheet(t('export.sheet.posts'));
  postsSheet.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: t('export.col.title'),       key: 'title' },
    { header: t('export.col.content'),     key: 'content' },
    { header: t('export.col.tag'),         key: 'tag' },
    { header: t('export.col.author'),      key: 'author' },
    { header: t('export.col.likes'),       key: 'likes' },
    { header: t('export.col.reports'),     key: 'reports' },
    { header: t('export.col.commentCount'),key: 'comments' },
    { header: t('export.col.pinned'),      key: 'pinned' },
    { header: t('export.col.featured'),    key: 'featured' },
    { header: t('export.col.visibility'),  key: 'visibility' },
    { header: t('export.col.createdAt'),   key: 'created' },
  ];
  const commentCounts = new Map();
  for (const c of s.comments) {
    commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1);
  }
  const sectionById = new Map((s.sections || []).map((sec) => [sec.id, sec]));
  const sortedPosts = [...s.posts].sort((a, b) => a.id - b.id);
  for (const p of sortedPosts) {
    const section = p.tag ? sectionById.get(p.tag) : null;
    const eff = effectiveVisibility(p, { forAdmin: false });
    postsSheet.addRow({
      id: p.id,
      title: p.title,
      content: p.content,
      tag: section ? section.name : '',
      author: p.author_tag,
      likes: p.likes || 0,
      reports: p.reports || 0,
      comments: commentCounts.get(p.id) || 0,
      pinned: boolText(t, !!p.pinned),
      featured: boolText(t, !!p.featured),
      visibility: visibilityText(t, p.visibility, eff),
      created: formatFull(p.created_at),
    });
  }
  styleHeader(postsSheet);
  autoSizeColumns(postsSheet);
  // wrap text in content column
  postsSheet.getColumn('content').alignment = { wrapText: true, vertical: 'top' };
  postsSheet.getColumn('content').width = 48;

  // -------- Comments sheet --------
  const commentsSheet = wb.addWorksheet(t('export.sheet.comments'));
  commentsSheet.columns = [
    { header: 'ID',                          key: 'id', width: 6 },
    { header: t('export.col.postId'),        key: 'post_id', width: 8 },
    { header: t('export.col.postTitle'),     key: 'post_title' },
    { header: t('export.col.content'),       key: 'content' },
    { header: t('export.col.author'),        key: 'author' },
    { header: t('export.col.likes'),         key: 'likes' },
    { header: t('export.col.reports'),       key: 'reports' },
    { header: t('export.col.visibility'),    key: 'visibility' },
    { header: t('export.col.createdAt'),     key: 'created' },
  ];
  const postById = new Map(s.posts.map((p) => [p.id, p]));
  const sortedComments = [...s.comments].sort((a, b) => a.id - b.id);
  for (const c of sortedComments) {
    const parent = postById.get(c.post_id);
    const eff = effectiveVisibility(c, { forAdmin: false });
    commentsSheet.addRow({
      id: c.id,
      post_id: c.post_id,
      post_title: parent ? parent.title : '',
      content: c.content,
      author: c.author_tag,
      likes: c.likes || 0,
      reports: c.reports || 0,
      visibility: visibilityText(t, c.visibility, eff),
      created: formatFull(c.created_at),
    });
  }
  styleHeader(commentsSheet);
  autoSizeColumns(commentsSheet);
  commentsSheet.getColumn('content').alignment = { wrapText: true, vertical: 'top' };
  commentsSheet.getColumn('content').width = 48;

  // -------- Reports sheet --------
  const reportsSheet = wb.addWorksheet(t('export.sheet.reports'));
  reportsSheet.columns = [
    { header: 'ID',                            key: 'id', width: 6 },
    { header: t('export.col.targetType'),      key: 'target_type' },
    { header: t('export.col.targetId'),        key: 'target_id', width: 8 },
    { header: t('export.col.targetPreview'),   key: 'preview' },
    { header: t('export.col.reporter'),        key: 'reporter' },
    { header: t('export.col.category'),        key: 'category' },
    { header: t('export.col.reason'),          key: 'reason' },
    { header: t('export.col.resolved'),        key: 'resolved' },
    { header: t('export.col.createdAt'),       key: 'created' },
  ];
  const sortedReports = [...(s.report_records || [])].sort((a, b) => a.id - b.id);
  for (const r of sortedReports) {
    let preview = '';
    if (r.target_type === 'post') {
      const p = postById.get(r.target_id);
      preview = p ? (p.title + ' — ' + (p.content || '').slice(0, 60)) : '';
    } else {
      const c = s.comments.find((x) => x.id === r.target_id);
      preview = c ? (c.content || '').slice(0, 80) : '';
    }
    reportsSheet.addRow({
      id: r.id,
      target_type: r.target_type === 'post' ? t('reports.typePost') : t('reports.typeComment'),
      target_id: r.target_id,
      preview,
      reporter: r.anon_id,
      category: t(CATEGORY_KEY[r.category] || 'report.cat.other'),
      reason: r.reason,
      resolved: boolText(t, !!r.resolved),
      created: formatFull(r.created_at),
    });
  }
  styleHeader(reportsSheet);
  autoSizeColumns(reportsSheet);
  reportsSheet.getColumn('reason').alignment = { wrapText: true, vertical: 'top' };
  reportsSheet.getColumn('reason').width = 38;
  reportsSheet.getColumn('preview').alignment = { wrapText: true, vertical: 'top' };
  reportsSheet.getColumn('preview').width = 38;

  // -------- Blocked words sheet --------
  const wordsSheet = wb.addWorksheet(t('export.sheet.words'));
  wordsSheet.columns = [
    { header: 'ID',                 key: 'id', width: 6 },
    { header: t('export.col.word'), key: 'word' },
  ];
  for (const w of [...(s.blocked_words || [])].sort((a, b) => a.id - b.id)) {
    wordsSheet.addRow({ id: w.id, word: w.word });
  }
  styleHeader(wordsSheet);
  autoSizeColumns(wordsSheet);

  // -------- Fill summary now that we have totals --------
  summary.addRow({ k: t('admin.stat.posts'), v: s.posts.length });
  summary.addRow({ k: t('admin.stat.comments'), v: s.comments.length });
  summary.addRow({ k: t('export.col.pendingReports'), v: (s.report_records || []).filter((r) => !r.resolved).length });
  summary.addRow({ k: t('export.col.totalReports'), v: (s.report_records || []).length });
  summary.addRow({ k: t('admin.stat.words'), v: (s.blocked_words || []).length });
  summary.addRow({ k: t('export.col.exportedAt'), v: formatFull(Date.now()) });

  return wb;
}
