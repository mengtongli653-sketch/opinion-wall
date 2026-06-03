# The Daily CWA · 《每日世华》

A student-run **campus news and opinion** site for the CWA community — editor-reviewed articles on the front page, a casual Free Discussion side-channel, anonymous-or-named bylines, user-created sections, a public Reader Letters / editor-contacts page, and per-article PDF download. Built with Next.js 14 (App Router), no database, no signup, no tracking.

《每日世华》是 CWA 同学自主运营的**校园新闻与观点**站点 —— 头版刊登经编辑审核的文章,自由讨论区即时发言,作者可选匿名或署名,版面由读者投稿时自建,网站底部还有一个公开的「读者来信 · 编辑联系方式」页面,文章可一键下载 PDF。基于 Next.js 14,无数据库、无注册、无追踪。

---

## Project context — IB DP CAS / 项目背景 — IB DP CAS

> **Author / 作者:** Peter Li 李孟桐
> **Programme / 项目:** IB Diploma Programme, DP1
> **School / 学校:** CWA 世华学校
> **CAS strands / CAS 维度:** **Creativity** · **Service**

This is an IB Diploma Programme **CAS (Creativity, Activity, Service)** project — a student-built campus newsroom giving classmates a low-friction place to publish opinion pieces, chat freely, ask for help, or share good news, with editorial moderation that keeps the front page useful. It combines a **Creativity** strand (designing and engineering the platform from scratch with Next.js 14, React Server Components, a custom moderation engine, a two-track publishing pipeline, and a restrained newspaper-style aesthetic) with a **Service** strand (running the editorial desk, reviewing submissions, publishing editor contact details, and maintaining the site for fellow students).

本项目是 IB Diploma Programme **CAS(Creativity 创造、Activity 活动、Service 服务)**框架下的学生作品 —— 一个由同学主笔的校园新闻+观点平台,既有经过编辑审核的头版稿件,也有即时发言的自由讨论区。它同时覆盖 **Creativity 创造**(从零设计与实现整套 Web 平台:Next.js 14、React 服务端组件、自研审核引擎、双轨发布流水线、克制的报纸式美术)与 **Service 服务**(运营编辑部、审阅投稿、公开编辑联系方式、为同学持续维护)两个 CAS 维度。

---

## Two publishing tracks / 两条发布轨道

The site runs two parallel feeds with deliberately different rules — formal news up top, casual chat off to the side.

整站并行两条信息流,规则刻意不同 —— 正式新闻在主区,日常闲聊在副区。

| Track / 轨道 | Front Page · 头版 (Articles · 文章) | Free Discussion · 自由讨论 |
|---|---|---|
| Workflow / 流程 | Reader submits → **editor reviews** → published / 读者投稿 → **编辑审阅** → 刊发 | Instant publish, no review / 即时发布,无需审核 |
| Headline / 标题 | Large serif, section label / 大 serif 报纸标题 + 版面 | Casual sans-serif one-liner / 一句话主题 |
| Body / 正文 | Long-form serif (≤ 5000 chars) / serif 长文 | Short, body-forward / 内容前置 |
| Section / 版面 | **Optional — user-created on submit** / **可选,投稿时自建** | None — single open feed / 无版面,统一信息流 |
| Badges / 徽章 | Latest · Pinned · Featured · Pending / 最新 · 置顶 · 精选 · 待审 | Discussion / 讨论 |
| PDF download / PDF 下载 | each article / 每篇文章 | — |
| Comments / 评论 | Yes / 支持 | Yes / 支持 |

---

## Features / 功能

- **Anonymous-or-named bylines** — every visitor gets a stable `匿名#A1B2C3` cookie tag, and any post or comment can opt-in to a public display name. Editors always see the underlying anonymous ID for moderation.
- **匿名或署名二选一** — 每位访客都有一个稳定的 `匿名#A1B2C3` cookie 标识,发文章或评论时可选择公开署名;无论选择哪个,编辑后台始终能看到匿名 ID 用于审核。

- **Editorial submission workflow** — reader-submitted articles land in the **投稿箱 / Submissions Inbox** with `status='pending'`. Editors approve (publish) or reject (delete) from the editor console.
- **编辑部审稿流** — 读者投稿先进入 **投稿箱**,状态为 `pending`;编辑在编辑界面里通过 / 驳回。

- **Free Discussion side-channel** — a `/forum` feed with instant publish and lighter chrome. The footer nav link is unstyled — same weight as Front Page — so the side-channel doesn't shout over the formal track.
- **自由讨论副频道** — `/forum` 页面即时发布、视觉更轻量;副导航上和「头版」并列朴素呈现,不抢主线注意力。

- **User-created sections** — there are no preset sections. When submitting an article, the user can pick from existing section chips (chosen by previous contributors) or type a new name; the server runs find-or-create by name (case-insensitive). Empty = no section. The front-page filter bar only shows sections that have at least one published article.
- **用户自建版面** — 没有预设版面,投稿时可点选已有版面或直接键入新名字,服务端按名字大小写不敏感地查找或创建。留空即不归类。头版顶部的筛选条只显示有已刊发文章的版面。

- **Per-article PDF** — every article detail page has a "下载 PDF / Download PDF" link that opens a print-friendly view and auto-fires the browser's print dialog. Pick "Save as PDF" — no extra deps, CJK fonts work out of the box.
- **每篇文章可下载 PDF** — 文章详情页有「下载 PDF」链接,打开打印视图后自动调起浏览器打印对话框,选「另存为 PDF」即下载。无新增依赖,中英文字体走系统字体。

- **Reader Letters / editor contacts page** — a public `/letters` page (linked from the footer of every page) lists who readers should write to and how. Editors curate the entries (name + optional role + contact label like `邮箱` / `微信` / `QQ` + value) through the admin console; readers see the same list rendered in newspaper style.
- **读者来信 · 编辑联系方式** — 每个页脚都有「读者来信」链接,打开 `/letters` 公开页;后台「编辑联系方式」面板可由编辑增删改:姓名 + 职务(可选) + 联系方式名称(如 `邮箱` / `微信` / `QQ`) + 内容,读者侧以报纸式排版呈现。

- **Comments on articles and discussions** — every post (article or discussion) has its own comments thread. Comments support the same anonymous/named identity toggle and run through the moderation pipeline.
- **每篇文章与讨论都有评论** — 评论同样支持匿名/署名切换,并接入完整的审核流水线。

- **Newspaper-style masthead** — centered serif brand《每日世华》, italic tagline, locale-aware date line, double horizontal rule. Subnav (Front Page · Discussion · Sign-in · language) sits below.
- **报纸式报头** — 居中 serif 刊名《每日世华》、斜体副刊名、自动本地化日期、双线分隔;副导航(头版 · 自由讨论 · 编辑登录 · 中英文)紧随其下。

- **Likes & reports** — duplicate-prevention via anonymous cookie ID; reports require a category + reason (≤ 200 chars).
- **赞同与举报** — 基于匿名 cookie ID 防重复;举报必须选类别 + 填理由(≤ 200 字)。

- **Auto-hide moderation** — content auto-hides when `reports ≥ 3 && reports / (likes + reports) ≥ 0.5`. Threshold is a one-line tweak in `lib/moderation.js`.
- **自动下架机制** — 举报数 ≥ 3 且占比 ≥ 50% 时自动下架。阈值可在 [lib/moderation.js](lib/moderation.js) 中一行修改。

- **Blocked-word filter** — ~77-entry school-friendly default list. Checked against headlines, bodies, comments, display names, and section names users try to create.
- **屏蔽词过滤** — 内置约 77 条校园友好的默认词表,对标题、正文、评论、署名,以及新建版面名一并校验。

- **Editor Console** — Submissions Inbox, Reports queue, Editor Contacts manager, Blocked Words manager, Excel export, recent-articles list with submission/discussion badges.
- **编辑界面** — 投稿箱、举报中心、编辑联系方式管理、屏蔽词管理、Excel 导出、近期文章列表(带投稿/讨论徽章)。

- **First-paint-only motion** — gentle ink-fade-in entrance on cards / masthead / article body when the page first loads or hard-refreshes. Client-side navigation between pages within the SPA does **not** replay the entrance, so clicking around feels instant. Honors `prefers-reduced-motion`.
- **动画仅在首次进入或刷新时出现** —— 卡片、报头、正文有克制的入场淡入;在站内点击切换页面时**不**重播,所以在内部跳转完全瞬时。同时尊重 `prefers-reduced-motion`。

- **i18n** — 中文 / English toggle, cookie-persisted, server-rendered (no flash of wrong language).
- **中英文切换** — cookie 持久化,服务端渲染,无语言闪烁。

- **Light & dark theme** — follows `prefers-color-scheme`. Blue & white palette throughout.
- **深浅色主题** — 跟随系统设置,蓝白配色。

- **Mobile-friendly** — sticky subnav, responsive layout, generous touch targets.
- **移动端友好** — sticky 副导航、自适应布局、触控热区达标。

- **Zero native deps** — pure JS, single `data.json` file as storage. Drop on any machine with Node 18+.
- **零原生依赖** — 纯 JS 实现,单个 `data.json` 文件存储,Node 18+ 即可运行。

---

## Quick start / 快速启动

```bash
npm install
cp .env.example .env.local   # edit ADMIN_PASSWORD and SESSION_SECRET
npm run dev                  # localhost only
# or
npm run dev:lan              # bind 0.0.0.0 for LAN access
```

安装依赖后,复制 `.env.example` 为 `.env.local`,修改 `ADMIN_PASSWORD` 和 `SESSION_SECRET`。`npm run dev` 仅本机访问,`npm run dev:lan` 监听 `0.0.0.0` 供局域网访问。

Open / 打开浏览器访问: http://localhost:3000

---

## Production / 生产部署

```bash
npm run build
npm run start:lan            # bind 0.0.0.0
```

If deploying on Windows and serving over the LAN, allow inbound TCP 3000 in the firewall (run PowerShell as admin):

Windows 上对局域网开放时,需要在防火墙放行 TCP 3000(以管理员身份运行 PowerShell):

```powershell
New-NetFirewallRule -DisplayName "The Daily CWA 3000" `
  -Direction Inbound -LocalPort 3000 -Protocol TCP `
  -Action Allow -Profile Private,Public
```

---

## Editor sign-in / 编辑登录

- Default password: `admin123` — override `ADMIN_PASSWORD` in `.env.local`.
- 默认口令 `admin123`,请在 `.env.local` 中覆盖 `ADMIN_PASSWORD`。

- Sign in at `/admin/login` (the subnav "编辑登录 / Editor Sign-in" link).
- 登录入口:顶栏「编辑登录 / Editor Sign-in」或直接访问 `/admin/login`。

- `SESSION_SECRET` should be a long random string — anyone who knows it can forge editor tokens.
- **务必修改** `SESSION_SECRET` 为一段长随机字符串,否则知道默认值的人可以伪造编辑会话。

---

## Editorial workflow / 编辑流程

1. **Reader writes an article** — optionally picks a section (existing chip or types a new name), writes headline + body, and chooses to use a display name or stay anonymous.
   **读者撰写文章** —— 可选版面(点已有版面 chip 或键入新名字),写标题与正文,可选实名(否则匿名)。

2. **Submission lands in the inbox** — saved with `status='pending'` and any newly-typed section is created at the same time. It does **not** appear on the public front page yet.
   **投稿进入投稿箱** —— 状态 `pending`,如果用户键入了新版面,服务端同时创建该版面;此时**不**出现在公开头版。

3. **Editor reviews in the console** — at `/admin`, sees the Submissions Inbox above other panels. Each card shows headline + section + body preview + byline (display name **and** anonymous ID).
   **编辑在编辑界面审稿** —— `/admin` 首先看到投稿箱,每张卡显示标题、版面、正文摘要、署名(实名 **和** 匿名 ID 双显)。

4. **Approve or reject**:
   - **Publish** → `status='published'`, `created_at` bumped so it surfaces at the top, appears on the front page with the "Latest" badge if it's the most recent.
   - **Reject** → permanently deleted.

   **通过 / 驳回**:
   - **通过** → `status='published'`,`created_at` 刷新,登上头版;若为最新还会带「最新」徽章。
   - **驳回** → 永久删除。

5. **Free Discussion bypass** — posts submitted via `/forum` skip steps 2–4 entirely; they go straight to `status='published'` with `kind='discussion'`. Editors still see them in the recent list with a "Discussion" badge.
   **自由讨论绕过** —— 经 `/forum` 发布的帖子完全跳过 2-4 步,直接 `status='published'`、`kind='discussion'`;编辑仍能在近期列表里看到,带「讨论」徽章。

---

## Reader Letters / editor contacts / 读者来信 · 编辑联系方式

Every page has a "读者来信 / Reader Letters" link in the footer. It opens `/letters`, a public page that:

每个页面底部都有「读者来信 / Reader Letters」链接,打开 `/letters` 公开页:

- Greets readers with a short intro paragraph (locale-aware).
- 用一段简介开头(中英文)。

- Lists each editor with **name** (serif, bold), optional **role** (italic), a **contact label** (small-caps, e.g. `邮箱` / `微信` / `QQ`), and the **contact value** (monospace).
- 列出每位编辑:**姓名**(serif 加粗)、**职务**(斜体,可选)、**联系方式名称**(小型大写,如 `邮箱` / `微信` / `QQ`)、**联系方式内容**(等宽字)。

- Shows an empty-state line if editors haven't published any contacts yet.
- 没有任何条目时显示 「编辑部尚未公开联系方式」。

Editors manage the list from the admin console:

编辑在 `/admin` 的「编辑联系方式」面板里管理:

- Inline **add** form (name required, others optional).
- **添加** 表单(姓名必填,其余可选)。

- Inline **edit** mode per row, with **save** / **cancel**.
- 每行可进入**编辑**模式,带**保存** / **取消**。

- **Delete** with confirmation.
- **删除**带确认。

- All endpoints (`POST /api/admin/editor-contacts`, `PATCH/DELETE /api/admin/editor-contacts/[id]`) check `isAdmin()`; non-editors get `403`.
- 所有写接口都过 `isAdmin()`,非编辑得 `403`。

---

## Per-article PDF / 每篇文章导出 PDF

Every article detail page has a "下载 PDF / Download PDF" link next to the back-link. Clicking it opens `/post/[id]/print` in a new tab:

每篇文章详情页的返回链接旁都有「下载 PDF」链接,点击后新标签打开 `/post/[id]/print`:

- The route server-renders a stripped-down printable layout: brand + date masthead, double rule, section label, headline, byline, body, source line.
- 服务端渲染极简打印版:**品牌 + 日期 + 双线 + 版面标签 + 标题 + 撰稿信息 + 正文 + 来源行**。

- A tiny client component (`PrintTrigger`) auto-fires `window.print()` ~350ms after mount. The user picks "Save as PDF" in the browser's print dialog.
- 客户端 `PrintTrigger` 组件在挂载后约 350ms 自动调起 `window.print()`,用户在对话框里选「另存为 PDF」即下载。

- `@media print` rules strip all chrome (masthead, subnav, footer, toolbar) so the PDF contains only the article.
- `@media print` 规则把所有屏幕装饰(报头、导航、页脚、提示条)隐藏,PDF 里只剩文章本体。

- **No new runtime deps** and Chinese / English fonts come from the system — works out of the box.
- **无新增运行时依赖**,中英文字体走系统字体,开箱即用。

---

## Motion / 动画

Motion only fires on **real** page loads — first visit, hard refresh (F5 / Ctrl+R), or direct URL entry. Internal SPA navigation (clicking around the site) is instant, no fades. This is enforced by an inline `<head>` script that adds an `entered` class to `<html>` after the first paint; every entrance animation in `globals.css` is gated by `html:not(.entered)`, so once the class is set, mounting new elements simply doesn't pick up an `animation` property.

动画**只**在真正的页面加载时跑 —— 首次访问、硬刷新(F5 / Ctrl+R)、直接打开 URL。SPA 内部跳转(点击站内链接)瞬时无淡入。`<head>` 里一段内联脚本在首屏渲染后给 `<html>` 加 `entered` 类,所有 `globals.css` 里的入场动画都用 `html:not(.entered)` 守门;一旦类加上,新挂载的元素就不会再匹配到 `animation` 属性。

`prefers-reduced-motion: reduce` 用户的所有动画/过渡/平滑滚动都会被瞬切到 0.001ms。

---

## Tech stack / 技术栈

- **Next.js 14** App Router with React Server Components.
- **Next.js 14** App Router 架构,使用 React 服务端组件。

- **No DB** — `data.json` holds posts (with `kind`, `status`, `display_name`, `tag` referring to a section id), comments, sections (user-created), editor contacts, blocked words, reactions, and report records.
- **无数据库** — 单个 `data.json` 文件存放帖子(含 `kind`/`status`/`display_name`/`tag` 指向版面 id)、评论、版面(用户自建)、编辑联系方式、屏蔽词、点赞与举报记录。

- **No client-side framework beyond React** — vanilla CSS with design tokens, dark-mode variables, and serif headline / sans body typography. Entrance animations are pure CSS gated by a `<html>` class.
- **无额外前端框架** — 仅使用 React,样式为原生 CSS,带主题变量、深色模式适配、serif 标题 + sans-serif 正文;入场动画纯 CSS,通过 `<html>` 上的类把关。

- **`exceljs`** for the editor's Excel export — the only application-level dependency beyond Next/React.
- **`exceljs`** 供编辑导出 Excel,是除 Next/React 外唯一的应用层依赖。

---

## Project layout / 目录结构

```
app/
  _components/                  client components / 客户端组件
    NewPostForm.js                composer with article/discussion modes / 文章&讨论两种模式的投稿表单
    CommentForm.js                comment form / 评论表单
    IdentityPicker.js             anonymous ↔ named segmented control / 匿名/署名分段控件
    TagPicker.js                  existing-or-new section picker / 已有版面 / 新建版面选择器
    SubmissionsPanel.js           editor inbox UI / 投稿箱面板
    ReportsPanel.js               report queue UI / 举报中心
    EditorContactsManager.js      contacts CRUD for /letters / 编辑联系方式增删改
    BlockedWordsManager.js        blocked-word manager / 屏蔽词管理
    LikeReportBar.js              like + report actions / 赞同 + 举报按钮
    HiddenContent.js              hidden-content placeholder / 下架内容占位
    PrintTrigger.js               auto-fires window.print() / 自动调用打印对话框
    LangSwitch.js                 中文/EN toggle / 语言切换
    ...
  api/                          route handlers / 路由处理
    posts/route.js                 POST → article(pending) or discussion(published)
                                   POST → 文章(pending)或讨论(直接 published)
    posts/[id]/route.js            GET / PATCH / DELETE
    sections/route.js              GET → list of user-created sections / 获取用户自建版面列表
    editor-contacts/route.js       GET → public editor contacts / 公开的编辑联系方式
    admin/posts/[id]/publish       POST → approve a submission / 通过投稿
    admin/editor-contacts/...      POST/PATCH/DELETE editor contacts (admin only) / 编辑专用 CRUD
    comments/...                   comment CRUD / 评论 CRUD
    admin/...                      other editor-only endpoints / 其他编辑专用接口
  admin/                        editor console pages / 编辑界面
  forum/                        Free Discussion feed / 自由讨论页面
  letters/                      public Reader Letters / contacts page / 公开「读者来信」页面
  post/[id]/                    article + comments detail / 文章详情 + 评论
  post/[id]/print/              PDF-print view / PDF 打印视图
  layout.js                     masthead + subnav + colophon + first-paint script / 报头 + 副导航 + 版权脚注 + 首屏脚本
  page.js                       front page (articles only) / 头版(只显示文章)
  globals.css                   design tokens + components + entrance motion + @media print
                                设计变量 + 组件 + 入场动画 + 打印样式
lib/
  db.js                         JSON-file persistence (posts/sections/contacts/etc.)
                                JSON 持久化(帖子 / 版面 / 联系人 / 等等)
  auth.js                       editor HMAC token + anonymous ID cookie / 编辑 HMAC 令牌 + 匿名 ID cookie
  filter.js                     blocked-word check / 屏蔽词校验
  i18n.js                       zh + en dictionaries / 中英文词典
  tags.js                       thin section helpers (no hardcoded list) / 版面辅助(无硬编码)
  time.js                       locale-aware relative time / 本地化相对时间
  moderation.js                 auto-hide policy / 自动下架策略
  export.js                     Excel export pipeline / Excel 导出流水线
```

---

## Seed default blocked words / 屏蔽词种子

The repo ships with a curated school-friendly blocked-word list (~77 entries covering profanity, slurs, school-violence threats, NSFW, illegal activity, and spam patterns). Run once after first install:

仓库内置一份校园友好的屏蔽词列表(约 77 条,涵盖脏话、歧视、校园暴力威胁、色情、违法行为及垃圾信息)。首次安装后执行一次即可:

```bash
npm run seed:words
```

The script is idempotent (skips existing entries). Restart the dev/prod server afterwards so the in-memory cache reloads. Tweak the list in `scripts/seed-blocked-words.js`.

脚本是幂等的(已存在条目会跳过)。执行后请重启 dev/prod 服务器,让内存缓存重新加载。可在 [scripts/seed-blocked-words.js](scripts/seed-blocked-words.js) 中调整词表。

---

## Configuration / 配置项

Environment variables / 环境变量:

| Env var | Default | Purpose / 用途 |
|---|---|---|
| `ADMIN_PASSWORD` | `admin123` | Editor sign-in password / 编辑登录口令 |
| `SESSION_SECRET` | `dev-secret-change-me` | HMAC key for editor session tokens / 编辑会话令牌的 HMAC 密钥 |

Moderation thresholds / 审核阈值 (in `lib/moderation.js`):

| Constant | Default | Effect / 作用 |
|---|---|---|
| `MIN_REPORTS` | `3` | Reports needed before auto-hide considered / 触发自动下架所需的最少举报数 |
| `HIDE_RATIO` | `0.5` | Hide when `reports / (likes + reports) ≥ this` / 当举报占比超过此值时下架 |

---

## Excel export / Excel 导出

Editors can export articles, discussions, comments, reports, and the blocked-word list as a multi-sheet `.xlsx` from the console. The export uses [`exceljs`](https://www.npmjs.com/package/exceljs) — no external service involved, the file is generated and downloaded locally.

编辑可在编辑界面把文章、讨论、评论、举报记录与屏蔽词表导出为多 sheet 的 `.xlsx` 文件。使用 [`exceljs`](https://www.npmjs.com/package/exceljs) 在本地生成下载,不经过任何外部服务。

---

## CAS Learning Outcomes / CAS 学习目标

This project is mapped against the following IB CAS Learning Outcomes:

本项目对应以下 IB CAS 学习目标:

### LO2 — Undertake new challenges and develop new skills / 承担新挑战、习得新技能

- **EN:** Built the platform without prior production experience in Next.js 14's App Router, React Server Components, HMAC-based session auth, file-backed persistence patterns, print-styled PDF generation, or first-paint-gated CSS motion. Each was learned and applied iteratively across the project.
- **中文:** 项目开始前没有 Next.js 14 App Router、React 服务端组件、基于 HMAC 的会话认证、文件存储模式、打印样式 PDF 生成、基于首屏类把关的 CSS 动画等实战经验,这些都是在做项目过程中边学边用、不断迭代落地的。

### LO3 — Initiate and plan a CAS experience / 自主发起并规划 CAS 体验

- **EN:** Scoped the project independently — from identifying the need (a low-friction newsroom for students to publish opinion and chat freely), to choosing the stack, designing the two-track publishing model and moderation rules, designing the user-created sections flow, and shipping a deployable artifact with a public editor-contacts surface.
- **中文:** 项目从问题识别(同学需要既有审核的发布通道、又有即时聊天的副频道)到技术选型、双轨发布机制与审核规则设计、用户自建版面流程设计、最终可部署交付并对外公开编辑联系方式,全流程由我独立规划。

### LO4 — Show commitment to and perseverance in CAS experiences / 展现承诺与坚持

- **EN:** Sustained development across planning, build, content seeding, editor tooling, Excel export, bilingual content, multiple aesthetic explorations (academic-journal → news-vibe → modern-product → reverted back to a settled newspaper look), editorial submission workflow, anonymous/named identity, PDF export, free-discussion side-channel, user-created sections, the public Reader Letters / editor-contacts page, and restrained first-paint-only motion — all visible in the project's commit history.
- **中文:** 项目持续推进涵盖规划、开发、内容种子、编辑工具、Excel 导出、双语内容、多次美术风格探索(学术期刊 → 现代新闻 → 产品后台 → 回到最终的报纸样式)、投稿审核流、匿名/署名身份、PDF 导出、自由讨论副频道、用户自建版面、公开「读者来信 · 编辑联系方式」页面,以及克制的「首屏才播」动画,提交历史可作佐证。

### LO7 — Recognise and consider the ethics of choices and actions / 认识并考量行为伦理

- **EN:** Anonymous platforms carry real ethical weight — they can empower honest voices but also enable harassment. Design choices throughout the project reflect deliberate tradeoffs: cookie-based pseudonymity (with an opt-in display name) rather than true anonymity, every report requires a category + reason, ratio-based auto-hide rather than first-report removal, an editor-reviewed front page so the published record stays accountable, a free-discussion side-channel so casual chat doesn't pollute that record, a school-appropriate blocked-word list that also screens new section names, an editor audit trail keeping the underlying anonymous ID visible even when posts are signed, and a public "Reader Letters" page so readers always know how to reach an actual editor instead of routing everything through anonymous flags.
- **中文:** 匿名平台天然带有伦理重量 —— 它既能让真实声音被听见,也可能被滥用为骚扰工具。项目中的多项设计决策都是在表达自由与社区安全之间反复权衡的结果:用 cookie 化名(可选公开署名)而非完全匿名、举报必须填类别+理由、按"举报/赞同"比例触发自动下架而非首报即删、头版经编辑审稿以保持公开档案的可问责性、自由讨论副频道避免日常闲聊污染头版档案、面向校园场景的屏蔽词表同时拦截新建版面名、编辑后台始终可见底层匿名 ID 即便用户公开署名,以及公开「读者来信」联系方式让读者随时能直接找到真人编辑,而不是只能通过匿名举报与编辑部沟通。

---

## Reflection / 反思

> _The author plans to fill this section in after the next CAS supervisor check-in._
> _作者将在下一次 CAS 导师沟通后补充此部分。_

### Motivation / 动机

_TODO — why this project, what problem it addresses for the school community._
_待补充 —— 为什么做这个项目,它为校园社区解决了什么问题。_

### Challenges / 挑战

_TODO — technical and non-technical challenges encountered (e.g. learning Next.js Server Components, deciding the moderation threshold, balancing anonymity with safety, designing the editorial pipeline, picking the right aesthetic after several iterations)._
_待补充 —— 遇到的技术与非技术挑战(例如学习 Next.js 服务端组件、确定审核阈值、在匿名与安全之间取舍、设计编辑审稿流水线、在多次尝试后确定最终美术风格)。_

### Skills developed / 习得的技能

_TODO — concrete skills gained, both hard (Next.js, HMAC auth, system design, print-styled PDF, performance-aware CSS motion) and soft (scope management, ethics-aware design, two-track product thinking, communicating contact channels to users)._
_待补充 —— 实际习得的能力,包括硬技能(Next.js、HMAC 认证、系统设计、打印样式 PDF、关注性能的 CSS 动画)与软技能(范围管理、带伦理意识的设计、双轨产品思维、把编辑部联系方式坦诚展示给读者)。_

### Outcomes & takeaways / 成果与体会

_TODO — what was shipped, who it serves, what was learned about responsibility, and what comes next._
_待补充 —— 最终交付了什么、服务了谁、对"责任"有什么新的理解、下一步打算做什么。_

---

## License / 许可证

MIT
