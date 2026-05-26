// Lightweight i18n. Locale comes from the `locale` cookie ('zh' | 'en').
// Server: import { getLocale, getDict } and read on each RSC.
// Client: useT() from app/_components/LangProvider.

export const LOCALES = ['zh', 'en'];
export const DEFAULT_LOCALE = 'zh';
export const LOCALE_COOKIE = 'locale';

export const BRAND = 'CWA Opinion Wall';

const dictionaries = {
  zh: {
    'site.title': BRAND,
    'site.tagline': '意见墙',
    'site.meta.description': '一个简单的匿名意见墙',

    'nav.home': '首页',
    'nav.admin': '管理后台',
    'nav.adminLogin': '管理员登录',
    'nav.logout': '退出',
    'nav.lang': 'EN',

    'home.empty.title': '这里还很安静',
    'home.empty.sub': '来做第一个发言者吧。',
    'home.back': '← 返回列表',

    'post.badge.pinned': '📌 置顶',
    'post.badge.featured': '✨ 精华',
    'post.comments.label': '💬',

    'compose.trigger': '说点什么…（无需登录，匿名身份将自动生成）',
    'compose.title': '发布匿名帖',
    'compose.collapse': '收起',
    'compose.titlePlaceholder': '标题',
    'compose.contentPlaceholder': '想说什么都行，注意文明发言 🌱',
    'compose.submit': '发布',
    'compose.submitting': '发布中…',
    'compose.fail': '发布失败',

    'comment.heading': '评论',
    'comment.empty': '还没有评论，来说两句吧。',
    'comment.formTitle': '发表评论',
    'comment.placeholder': '说点什么…',
    'comment.submit': '发表评论',
    'comment.submitting': '提交中…',
    'comment.fail': '评论失败',

    'admin.title': '管理后台',
    'admin.welcome': '欢迎回来 👋',
    'admin.stat.posts': '帖子数',
    'admin.stat.comments': '评论数',
    'admin.stat.words': '屏蔽词',
    'admin.recent.title': '最近 50 条帖子',
    'admin.recent.empty': '暂无帖子',
    'admin.words.title': '屏蔽词管理',
    'admin.words.placeholder': '输入要屏蔽的词',
    'admin.words.add': '添加',
    'admin.words.adding': '添加中…',
    'admin.words.empty': '暂无屏蔽词',
    'admin.words.confirmDel': '确认删除该屏蔽词？',
    'admin.words.addFail': '添加失败',

    'admin.menu.pin': '置顶',
    'admin.menu.unpin': '取消置顶',
    'admin.menu.feature': '设为精华',
    'admin.menu.unfeature': '取消精华',
    'admin.menu.delete': '删除',
    'admin.confirm.delPost': '确认删除该帖子？',
    'admin.confirm.delComment': '确认删除该评论？',
    'admin.toast.pinned': '已置顶',
    'admin.toast.unpinned': '已取消置顶',
    'admin.toast.featured': '已设为精华',
    'admin.toast.unfeatured': '已取消精华',
    'admin.toast.deleted': '已删除',
    'admin.toast.commentDeleted': '评论已删除',
    'admin.toast.opFail': '操作失败',
    'admin.toast.delFail': '删除失败',
    'admin.aria.menu': '管理员操作',

    'login.title': '管理员登录',
    'login.placeholder': '管理员密码',
    'login.submit': '登录',
    'login.submitting': '登录中…',
    'login.fail': '登录失败',
    'login.hint.pre': '默认密码',
    'login.hint.post': '，可在 .env.local 修改 ADMIN_PASSWORD',

    'time.justNow': '刚刚',
    'time.minutes': '分钟前',
    'time.hours': '小时前',
    'time.yesterday': '昨天',
    'time.days': '天前',
    'time.weeks': '周前',
    'time.months': '个月前',
    'time.years': '年前',

    'common.cancel': '取消',
    'common.close': '关闭',
    'common.opFail': '操作失败',

    'tag.chat': '闲聊',
    'tag.help': '求助',
    'tag.idea': '想法',
    'tag.rec': '安利',
    'tag.news': '好消息',
    'tag.vent': '吐槽',
    'tag.ask': '提问',

    'compose.tagLabel': '选个标签（可选）',
    'home.tag.all': '全部',

    'like.do': '点赞',
    'like.cancel': '取消点赞',

    'report.title': '举报内容',
    'report.subtitle': '请告诉我们这段内容为什么不合适，管理员会审核处理。',
    'report.categoryLabel': '举报类型',
    'report.reasonLabel': '具体说明',
    'report.required': '必填',
    'report.reasonPlaceholder': '请简要描述原因（≤ 200 字）',
    'report.submit': '提交举报',
    'report.submitting': '提交中…',
    'report.alreadyReported': '你已举报过此内容',
    'report.toastOk': '已提交举报，等待管理员处理',
    'report.toastDup': '你已举报过此内容',
    'report.toastFail': '举报失败',

    'report.cat.spam':    '🧹 垃圾广告',
    'report.cat.attack':  '😡 人身攻击',
    'report.cat.illegal': '🚫 违法违规',
    'report.cat.misinfo': '❌ 不实信息',
    'report.cat.nsfw':    '🔞 不适内容',
    'report.cat.other':   '🤔 其他',

    'hidden.title': '此内容因举报较多被隐藏',
    'hidden.sub': '等待管理员审核中。',
    'hidden.showAnyway': '仍然查看',
    'hidden.shown': '已展开被隐藏内容',
    'hidden.hideAgain': '收起',

    'admin.stat.pendingReports': '待处理举报',
    'admin.menu.visibility': '可见性',
    'admin.menu.visAuto': '自动判定',
    'admin.menu.visShown': '强制显示',
    'admin.menu.visHidden': '强制隐藏',
    'admin.toast.visAuto': '已恢复自动判定',
    'admin.toast.visShown': '已强制显示',
    'admin.toast.visHidden': '已强制隐藏',

    'reports.title': '举报中心',
    'reports.empty': '暂无待处理的举报',
    'reports.typePost': '帖子',
    'reports.typeComment': '评论',
    'reports.reasonsHeading': '举报理由',
    'reports.viewInThread': '查看上下文',
    'reports.btnHide': '强制隐藏',
    'reports.btnShow': '强制显示',
    'reports.btnResolve': '标记已处理',
    'reports.btnDelete': '删除内容',
    'reports.toastResolved': '已标记为已处理',
  },
  en: {
    'site.title': BRAND,
    'site.tagline': 'Opinion Wall',
    'site.meta.description': 'A simple anonymous opinion wall',

    'nav.home': 'Home',
    'nav.admin': 'Admin',
    'nav.adminLogin': 'Admin Login',
    'nav.logout': 'Log out',
    'nav.lang': '中文',

    'home.empty.title': "It's quiet here",
    'home.empty.sub': 'Be the first to say something.',
    'home.back': '← Back',

    'post.badge.pinned': '📌 Pinned',
    'post.badge.featured': '✨ Featured',
    'post.comments.label': '💬',

    'compose.trigger': "Say something… (no sign-in, you'll get an anonymous tag)",
    'compose.title': 'New anonymous post',
    'compose.collapse': 'Collapse',
    'compose.titlePlaceholder': 'Title',
    'compose.contentPlaceholder': 'Anything on your mind. Be kind 🌱',
    'compose.submit': 'Post',
    'compose.submitting': 'Posting…',
    'compose.fail': 'Failed to post',

    'comment.heading': 'Comments',
    'comment.empty': 'No comments yet. Be the first.',
    'comment.formTitle': 'Add a comment',
    'comment.placeholder': 'Say something…',
    'comment.submit': 'Post comment',
    'comment.submitting': 'Posting…',
    'comment.fail': 'Failed to post comment',

    'admin.title': 'Admin Console',
    'admin.welcome': 'Welcome back 👋',
    'admin.stat.posts': 'Posts',
    'admin.stat.comments': 'Comments',
    'admin.stat.words': 'Blocked words',
    'admin.recent.title': 'Recent 50 posts',
    'admin.recent.empty': 'No posts yet',
    'admin.words.title': 'Blocked words',
    'admin.words.placeholder': 'Enter a word to block',
    'admin.words.add': 'Add',
    'admin.words.adding': 'Adding…',
    'admin.words.empty': 'No blocked words',
    'admin.words.confirmDel': 'Delete this blocked word?',
    'admin.words.addFail': 'Failed to add',

    'admin.menu.pin': 'Pin',
    'admin.menu.unpin': 'Unpin',
    'admin.menu.feature': 'Mark featured',
    'admin.menu.unfeature': 'Unmark featured',
    'admin.menu.delete': 'Delete',
    'admin.confirm.delPost': 'Delete this post?',
    'admin.confirm.delComment': 'Delete this comment?',
    'admin.toast.pinned': 'Pinned',
    'admin.toast.unpinned': 'Unpinned',
    'admin.toast.featured': 'Marked as featured',
    'admin.toast.unfeatured': 'Unmarked as featured',
    'admin.toast.deleted': 'Deleted',
    'admin.toast.commentDeleted': 'Comment deleted',
    'admin.toast.opFail': 'Operation failed',
    'admin.toast.delFail': 'Failed to delete',
    'admin.aria.menu': 'Admin actions',

    'login.title': 'Admin Login',
    'login.placeholder': 'Admin password',
    'login.submit': 'Sign in',
    'login.submitting': 'Signing in…',
    'login.fail': 'Login failed',
    'login.hint.pre': 'Default password',
    'login.hint.post': ' — change ADMIN_PASSWORD in .env.local',

    'time.justNow': 'just now',
    'time.minutes': 'min ago',
    'time.hours': 'h ago',
    'time.yesterday': 'yesterday',
    'time.days': 'd ago',
    'time.weeks': 'w ago',
    'time.months': 'mo ago',
    'time.years': 'y ago',

    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.opFail': 'Operation failed',

    'tag.chat': 'Chat',
    'tag.help': 'Help',
    'tag.idea': 'Idea',
    'tag.rec': 'Recommend',
    'tag.news': 'Good news',
    'tag.vent': 'Vent',
    'tag.ask': 'Question',

    'compose.tagLabel': 'Pick a tag (optional)',
    'home.tag.all': 'All',

    'like.do': 'Like',
    'like.cancel': 'Unlike',

    'report.title': 'Report content',
    'report.subtitle': "Tell us what's wrong with this. Admins will review.",
    'report.categoryLabel': 'Category',
    'report.reasonLabel': 'Details',
    'report.required': 'required',
    'report.reasonPlaceholder': 'Briefly describe the reason (≤ 200 chars)',
    'report.submit': 'Submit report',
    'report.submitting': 'Submitting…',
    'report.alreadyReported': "You've already reported this",
    'report.toastOk': 'Report submitted — admins will review',
    'report.toastDup': "You've already reported this",
    'report.toastFail': 'Failed to submit report',

    'report.cat.spam':    '🧹 Spam',
    'report.cat.attack':  '😡 Harassment',
    'report.cat.illegal': '🚫 Illegal',
    'report.cat.misinfo': '❌ Misinformation',
    'report.cat.nsfw':    '🔞 NSFW',
    'report.cat.other':   '🤔 Other',

    'hidden.title': 'Hidden due to reports',
    'hidden.sub': 'Awaiting admin review.',
    'hidden.showAnyway': 'Show anyway',
    'hidden.shown': 'Showing reported content',
    'hidden.hideAgain': 'Collapse',

    'admin.stat.pendingReports': 'Pending reports',
    'admin.menu.visibility': 'Visibility',
    'admin.menu.visAuto': 'Auto',
    'admin.menu.visShown': 'Force show',
    'admin.menu.visHidden': 'Force hide',
    'admin.toast.visAuto': 'Visibility set to auto',
    'admin.toast.visShown': 'Forced visible',
    'admin.toast.visHidden': 'Forced hidden',

    'reports.title': 'Report Center',
    'reports.empty': 'No pending reports',
    'reports.typePost': 'Post',
    'reports.typeComment': 'Comment',
    'reports.reasonsHeading': 'Report reasons',
    'reports.viewInThread': 'View in thread',
    'reports.btnHide': 'Force hide',
    'reports.btnShow': 'Force show',
    'reports.btnResolve': 'Mark resolved',
    'reports.btnDelete': 'Delete',
    'reports.toastResolved': 'Marked as resolved',
  },
};

export function normalizeLocale(raw) {
  if (LOCALES.includes(raw)) return raw;
  return DEFAULT_LOCALE;
}

export function getDict(locale) {
  return dictionaries[normalizeLocale(locale)];
}

// Server helper for RSCs: read the locale cookie and return [locale, t].
// Pass in the result of cookies() to keep this module free of next/headers.
export function readLocaleFromCookies(cookieStore) {
  const v = cookieStore?.get?.(LOCALE_COOKIE)?.value;
  return normalizeLocale(v);
}

export function makeT(locale) {
  const dict = getDict(locale);
  return (key) => dict[key] ?? key;
}
