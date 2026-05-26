#!/usr/bin/env node
/**
 * Seed the blocked-words list with a sane default set for a school context.
 *
 * Usage:  node scripts/seed-blocked-words.js
 *
 * Idempotent: existing words are kept and duplicates skipped.
 * The list below leans toward "high signal, low false-positive" — single
 * characters like 操 are deliberately avoided so 操作 / 操场 still go through.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.json');

const WORDS = [
  // ---- 脏话 / 侮辱 ----
  '傻逼', '傻B', '煞笔', '煞B', '傻逼玩意',
  '卧槽', '我操你', '操你妈', '操他妈', '操你大爷',
  '草泥马', '马勒戈壁', '马了个逼', '妈个鸡',
  '妈卖批', '卖批',
  '狗日的', '狗东西', '狗娘养',
  '你妈死了', '死全家', '全家死光',
  '死胖子', '死矮子', '死丑八怪',

  // ---- 歧视 ----
  '娘炮', '死娘炮', '娘娘腔',
  '死基佬', '死同性恋', '死拉拉',
  '死乡下', '土包子', '乡巴佬',
  '黑鬼', '印度阿三',

  // ---- 校园暴力 / 威胁 ----
  '揍死你', '打死你', '弄死你', '干死你',
  '出来单挑', '放学别走', '放学等着',
  '灭你口', '人肉你',

  // ---- 性 / 黄色 ----
  '鸡巴', '操逼', '操B',
  '约炮', '一夜情', '开房',
  'AV', '黄片', '黄网', '毛片',

  // ---- 违法 / 学术不端 ----
  '代写', '代考', '找枪手', '卖答案', '包过',
  '冰毒', '海洛因', '大麻', '摇头丸',
  '网赌', '时时彩', '六合彩',

  // ---- 黑产 / 广告 ----
  '加微信', '加wx', '加vx',
  '兼职日入', '月入过万', '躺赚', '微商',
  '刷单', '高佣金', '红包群',
];

function load() {
  if (!fs.existsSync(DB_PATH)) {
    return {
      meta: { post_seq: 0, comment_seq: 0, word_seq: 0, report_seq: 0 },
      posts: [],
      comments: [],
      blocked_words: [],
      reactions: [],
      report_records: [],
    };
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const state = JSON.parse(raw);
  state.meta = state.meta || {};
  state.meta.word_seq = state.meta.word_seq || 0;
  state.blocked_words = state.blocked_words || [];
  return state;
}

function save(state) {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function run() {
  const state = load();
  const existing = new Set(state.blocked_words.map((w) => w.word.toLowerCase()));
  let added = 0;
  let skipped = 0;

  for (const word of WORDS) {
    if (existing.has(word.toLowerCase())) {
      skipped++;
      continue;
    }
    state.meta.word_seq += 1;
    state.blocked_words.push({ id: state.meta.word_seq, word });
    existing.add(word.toLowerCase());
    added++;
  }

  save(state);

  console.log(`✓ Done. Added ${added} new blocked words, skipped ${skipped} duplicates.`);
  console.log(`  Total in dictionary: ${state.blocked_words.length}`);
  console.log(`  File: ${DB_PATH}`);
  if (added > 0) {
    console.log('');
    console.log('  ⚠️  If your dev/prod server is running, restart it — it caches');
    console.log('     data.json in memory and won\'t see the new words until restart.');
  }
}

run();
