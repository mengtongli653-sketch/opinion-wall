# The Daily CWA · 《每日世华》

A student-run **campus news and opinion** site for the CWA community — editor-curated articles on the front page, a casual Free Discussion side-channel, anonymous-or-named bylines, per-article PDF download. Built with Next.js 14 (App Router), no database, no signup, no tracking.

《每日世华》是 CWA 同学自主运营的**校园新闻与观点**站点 —— 头版刊登经编辑审核的文章,自由讨论区即时发言,作者可选匿名或署名,文章可一键下载 PDF。基于 Next.js 14,无数据库、无注册、无追踪。

---

## Project context — IB DP CAS / 项目背景 — IB DP CAS

> **Author / 作者:** Peter Li 李孟桐
> **Programme / 项目:** IB Diploma Programme, DP1
> **School / 学校:** CWA 世华学校
> **CAS strands / CAS 维度:** **Creativity** · **Service**

This is an IB Diploma Programme **CAS (Creativity, Activity, Service)** project — a student-built campus newsroom giving classmates a low-friction place to publish opinion pieces, chat freely, ask for help, or share good news, with editorial moderation that keeps the front page useful. It combines a **Creativity** strand (designing and engineering the platform from scratch with Next.js 14, React Server Components, a custom moderation engine and a two-track publishing pipeline) with a **Service** strand (running the editorial desk, reviewing submissions, and maintaining the site for fellow students).

本项目是 IB Diploma Programme **CAS(Creativity 创造、Activity 活动、Service 服务)**框架下的学生作品 —— 一个由同学主笔的校园新闻+观点平台,既有经过编辑审核的头版稿件,也有即时发言的自由讨论区。它同时覆盖 **Creativity 创造**(从零设计与实现整套 Web 平台:Next.js 14、React Server Components、自研审核引擎、双轨发布流水线)与 **Service 服务**(运营编辑部、审阅投稿、为同学持续维护)两个 CAS 维度。

---

## Two publishing tracks / 两条发布轨道

The site runs two parallel feeds with deliberately different rules — formal news up top, casual chat off to the side.

整站并行两条信息流,规则刻意不同 —— 正式新闻在主区,日常闲聊在副区。

| Track / 轨道 | Front Page · 头版 (Articles · 文章) | Free Discussion · 自由讨论 |
|---|---|---|
| Workflow / 流程 | Reader submits → **editor reviews** → published / 读者投稿 → **编辑审阅** → 刊发 | Instant publish, no review / 即时发布,无需审核 |
| Headline / 标题 | Large serif, section label / 大 serif 报纸标题 + 版面 | Casual sans-serif one-liner / 一句话主题 |
| Body / 正文 | Long-form serif (≤ 5000 chars) / serif 长文 | Short, body-forward / 内容前置 |
| Section / 版面 | Required: Op-Ed / Advice / Ideas / Reviews / Campus / Vents / Q&A | None — single open feed / 无版面,统一信息流 |
| Badges / 徽章 | 🔴 LATEST · 🗞 FRONT PAGE · ✶ EDITORS' PICK | 💬 DISCUSSION |
| PDF download / PDF 下载 | ✅ each article / ✅ 每篇文章 | — |
| Comments / 评论 | ✅ Reader Letters / ✅ 读者来信 | ✅ |

---

## Features / 功能

- **Anonymous-or-named bylines** — every visitor gets a stable `匿名#A1B2C3` cookie tag, and any post or comment can opt-in to a public display name. Editors always see the underlying anonymous ID for moderation.
- **匿名或署名二选一** — 每位访客都有一个稳定的 `匿名#A1B2C3` cookie 标识,发文章或评论时可选择公开署名;无论选择哪个,编辑后台始终能看到匿名 ID 用于审核。

- **Editorial submission workflow** — reader-submitted articles land in the **投稿箱 / Submissions Inbox** with a `pending` status. Editors approve (publish) or reject (delete) from the editor console.
- **编辑部审稿流** — 读者投稿先进入 **投稿箱**,状态为 `pending`;编辑在编辑界面里 ✓ 刊发 或 ✗ 退稿。

- **Free Discussion side-channel** — a `/forum` feed with instant publish, lighter chrome, and a small subnav pill so it stays a secondary channel.
- **自由讨论副频道** — `/forum` 页面即时发布、视觉更轻量,顶栏只用一个**小药丸**展示,不抢头版风头。

- **Per-article PDF** — a `📄 下载 PDF / Download PDF` link opens a print-friendly view that auto-triggers the browser's print dialog. Pick "Save as PDF" — no extra deps, CJK fonts work out of the box.
- **每篇文章可下载 PDF** — 点击 `📄 下载 PDF` 打开打印视图,自动调起浏览器打印对话框,选「另存为 PDF」即下载。无新增依赖,中英文字体直接走系统。

- **Newspaper-style masthead** — centered serif brand《每日世华》, italic tagline, locale-aware date line, double horizontal rule.
- **报纸式报头** — 居中 serif 刊名《每日世华》、斜体副刊名、自动本地化日期、双线分隔。

- **7 curated sections** — 漫谈 / 求助 / 思辨 / 推荐 / 校园 / 心声 / 提问 (Op-Ed / Advice / Ideas / Reviews / Campus / Vents / Q&A) with one-click tab filtering.
- **7 个预设版面** — 漫谈 / 求助 / 思辨 / 推荐 / 校园 / 心声 / 提问,顶部一键切换。

- **Likes (endorsements) & flags (reports)** — duplicate-prevention via anonymous cookie ID; reports require a category + reason (≤ 200 chars).
- **赞同与申诉** — 基于匿名 cookie ID 防重复;申诉必须选类别 + 填理由(≤ 200 字)。

- **Auto-hide moderation** — content auto-hides when `reports ≥ 3 && reports / (likes + reports) ≥ 0.5`. Threshold is a one-line tweak in `lib/moderation.js`.
- **自动下架机制** — 申诉数 ≥ 3 且占比 ≥ 50% 时自动下架。阈值可在 [lib/moderation.js](lib/moderation.js) 中一行修改。

- **Blocked-word filter** — ~77-entry school-friendly default list. Checked against headlines, bodies, comments, and display names.
- **屏蔽词过滤** — 内置约 77 条校园友好的默认词表,对标题、正文、评论与署名一并校验。

- **Editor Console** — Submissions Inbox, Flag Queue, Blocked Words manager, Excel export, recent-articles list with submission/discussion badges.
- **编辑界面** — 投稿箱、申诉中心、屏蔽词管理、Excel 导出、近期文章列表(带投稿/讨论徽章)。

- **i18n** — 中文 / English toggle, cookie-persisted, server-rendered (no flash of wrong language).
- **中英文切换** — cookie 持久化,服务端渲染,无语言闪烁。

- **Light & dark theme** — follows `prefers-color-scheme`. Blue & white palette.
- **深浅色主题** — 跟随系统设置,蓝白配色。

- **Mobile-friendly** — sticky frosted-glass subnav, responsive layout, generous touch targets.
- **移动端友好** — 毛玻璃 sticky 副导航条、自适应布局、触控热区达标。

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

1. **Reader writes an article** — picks a section, writes headline + body, optionally chooses to use their display name instead of the anonymous tag.
   **读者撰写文章** —— 选版面、写标题与正文,可选实名(否则匿名)。

2. **Submission lands in the inbox** — saved with `status='pending'`. It does **not** appear on the public front page.
   **投稿进入投稿箱** —— 状态 `pending`,**不**出现在公开头版。

3. **Editor reviews in the console** — at `/admin`, sees the Submissions Inbox above other panels. Each card shows headline + section + body preview + byline (display name AND anonymous ID).
   **编辑在编辑界面审稿** —— `/admin` 首先看到投稿箱,每张卡显示标题、版面、正文摘要、署名(实名 + 匿名 ID 双显)。

4. **Approve or reject**:
   - **✓ 刊发 / Publish** → `status='published'`, `created_at` bumped so it surfaces at the top, appears on the front page with the 🔴 LATEST badge if it's the most recent.
   - **✗ 退稿 / Reject** → permanently deleted.

   **批准 / 退稿**:
   - **✓ 刊发** → `status='published'`,`created_at` 刷新,登上头版;若为最新还会带 🔴 最新 徽章。
   - **✗ 退稿** → 永久删除。

5. **Free Discussion bypass** — posts submitted via `/forum` skip steps 2–4 entirely; they go straight to `status='published'` with `kind='discussion'`. Editors still see them in the recent list with a 💬 DISCUSSION badge.
   **自由讨论绕过** —— 经 `/forum` 发布的帖子完全跳过 2-4 步,直接 `status='published'`、`kind='discussion'`;编辑仍能在近期列表里看到,带 💬 DISCUSSION 徽章。

---

## Per-article PDF / 每篇文章导出 PDF

Every article detail page has a `📄 下载 PDF / Download PDF` link next to the back-link. Clicking it opens `/post/[id]/print` in a new tab:

每篇文章详情页的返回链接旁都有 `📄 下载 PDF` 链接,点击后新标签打开 `/post/[id]/print`:

- The route server-renders a stripped-down printable layout: brand + date masthead, double rule, section label, headline, byline, body, source line.
- 服务端渲染极简打印版:**品牌 + 日期 + 双线 + 版面标签 + 标题 + 撰稿信息 + 正文 + 来源行**。

- A tiny client component (`PrintTrigger`) auto-fires `window.print()` ~350ms after mount. The user picks "Save as PDF" in the browser's print dialog.
- 客户端 `PrintTrigger` 组件在挂载后约 350ms 自动调起 `window.print()`,用户在对话框里选「另存为 PDF」即下载。

- `@media print` rules strip all chrome (masthead, subnav, footer, toolbar) so the PDF contains only the article.
- `@media print` 规则把所有屏幕装饰(报头、导航、页脚、提示条)隐藏,PDF 里只剩文章本体。

- **No new runtime deps** and Chinese / English fonts come from the system — works out of the box.
- **无新增运行时依赖**,中英文字体走系统字体,开箱即用。

---

## Tech stack / 技术栈

- **Next.js 14** App Router with React Server Components.
- **Next.js 14** App Router 架构,使用 React 服务端组件。

- **No DB** — `data.json` holds posts (with `kind`, `status`, `display_name`), comments, blocked words, reactions, and flag records.
- **无数据库** — 单个 `data.json` 文件存放帖子(含 `kind`/`status`/`display_name`)、评论、屏蔽词、点赞与申诉记录。

- **No client-side framework beyond React** — vanilla CSS with design tokens, dark-mode variables, and serif headline / sans body typography.
- **无额外前端框架** — 仅使用 React,样式为原生 CSS,带主题变量、深色模式适配、serif 标题 + sans-serif 正文的报纸式排版。

- **`exceljs`** for the editor's Excel export — the only application-level dependency beyond Next/React.
- **`exceljs`** 供编辑导出 Excel,是除 Next/React 外唯一的应用层依赖。

---

## Project layout / 目录结构

```
app/
  _components/        client components / 客户端组件
    NewPostForm.js      composer with article/discussion modes / 文章&讨论两种模式的投稿表单
    IdentityPicker.js   anonymous ↔ named segmented control / 匿名/实名分段控件
    SubmissionsPanel.js editor inbox UI / 投稿箱面板
    ReportsPanel.js     flag queue UI / 申诉中心
    CommentForm.js      reader-letter form / 读者来信表单
    LikeReportBar.js    endorse + flag actions / 赞同 + 申诉按钮
    HiddenContent.js    pulled-content placeholder / 下架内容占位
    PrintTrigger.js     auto-fires window.print() / 自动调用打印对话框
    LangSwitch.js       中文/EN toggle / 语言切换
    ...
  api/                route handlers / 路由处理
    posts/route.js                       POST → article(pending) or discussion(published)
                                          POST → 文章(pending)或讨论(直接 published)
    posts/[id]/route.js                  GET / PATCH / DELETE
    admin/posts/[id]/publish/route.js    POST → approve a submission / 批准投稿
    comments/...                          comment CRUD / 评论 CRUD
    admin/...                             editor-only endpoints / 编辑专用接口
  admin/              editor console pages / 编辑界面
  forum/              Free Discussion feed / 自由讨论页面
  post/[id]/          article + comments detail / 文章详情 + 评论
  post/[id]/print/    PDF-print view / PDF 打印视图
  layout.js           masthead + subnav + colophon / 报头 + 副导航 + 版权脚注
  page.js             front page (articles only) / 头版(只显示文章)
  globals.css         design tokens + components + @media print / 设计变量 + 组件 + 打印样式
lib/
  db.js               JSON-file persistence + kind/status helpers / JSON 持久化 + 类型/状态辅助
  auth.js             editor HMAC token + anonymous ID cookie / 编辑 HMAC 令牌 + 匿名 ID cookie
  filter.js           blocked-word check / 屏蔽词校验
  i18n.js             zh + en dictionaries / 中英文词典
  tags.js             7 curated section IDs / 7 个版面 ID
  time.js             locale-aware relative time / 本地化相对时间
  moderation.js       auto-hide policy / 自动下架策略
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
| `MIN_REPORTS` | `3` | Flags needed before auto-hide considered / 触发自动下架所需的最少申诉数 |
| `HIDE_RATIO` | `0.5` | Hide when `flags / (endorsements + flags) ≥ this` / 当申诉占比超过此值时下架 |

---

## Excel export / Excel 导出

Editors can export articles, discussions, comments, flags, and the blocked-word list as a multi-sheet `.xlsx` from the console. The export uses [`exceljs`](https://www.npmjs.com/package/exceljs) — no external service involved, the file is generated and downloaded locally.

编辑可在编辑界面把文章、讨论、评论、申诉记录与屏蔽词表导出为多 sheet 的 `.xlsx` 文件。使用 [`exceljs`](https://www.npmjs.com/package/exceljs) 在本地生成下载,不经过任何外部服务。

---

## CAS Learning Outcomes / CAS 学习目标

This project is mapped against the following IB CAS Learning Outcomes:

本项目对应以下 IB CAS 学习目标:

### LO2 — Undertake new challenges and develop new skills / 承担新挑战、习得新技能

- **EN:** Built the platform without prior production experience in Next.js 14's App Router, React Server Components, HMAC-based session auth, file-backed persistence patterns, or print-styled PDF generation. Each was learned and applied iteratively across the project.
- **中文:** 项目开始前没有 Next.js 14 App Router、React 服务端组件、基于 HMAC 的会话认证、文件存储模式、打印样式 PDF 生成的实战经验,这些都是在做项目过程中边学边用、不断迭代落地的。

### LO3 — Initiate and plan a CAS experience / 自主发起并规划 CAS 体验

- **EN:** Scoped the project independently — from identifying the need (a low-friction newsroom for students to publish opinion and chat freely), to choosing the stack, designing the two-track publishing model and moderation rules, and shipping a deployable artifact.
- **中文:** 项目从问题识别(同学需要既有审核的发布通道、又有即时聊天的副频道)到技术选型、双轨发布机制与审核规则设计、最终可部署交付,全流程由我独立规划。

### LO4 — Show commitment to and perseverance in CAS experiences / 展现承诺与坚持

- **EN:** Sustained development across planning, build, content seeding, editor tooling, Excel export, bilingual content, news-vibe redesign, editorial submission workflow, anonymous/named identity, PDF export, and a free-discussion side-channel — visible in the project's commit history.
- **中文:** 项目持续推进涵盖规划、开发、内容种子、编辑工具、Excel 导出、双语内容、新闻样式改版、投稿审核流、匿名/实名身份、PDF 导出、自由讨论副频道等多个阶段,提交历史可作佐证。

### LO7 — Recognise and consider the ethics of choices and actions / 认识并考量行为伦理

- **EN:** Anonymous platforms carry real ethical weight — they can empower honest voices but also enable harassment. Design choices throughout the project reflect deliberate tradeoffs: cookie-based pseudonymity (with an opt-in display name) rather than true anonymity, every flag requires a category + reason, ratio-based auto-hide rather than first-report removal, an editor-reviewed front page so the published record stays accountable, a free-discussion side-channel so casual chat doesn't pollute that record, a school-appropriate blocked-word list, and an editor audit trail keeping the underlying anonymous ID visible even when posts are signed.
- **中文:** 匿名平台天然带有伦理重量 —— 它既能让真实声音被听见,也可能被滥用为骚扰工具。项目中的多项设计决策都是在表达自由与社区安全之间反复权衡的结果:用 cookie 化名(可选公开署名)而非完全匿名、申诉必须填类别+理由、按"申诉/赞同"比例触发自动下架而非首报即删、头版经编辑审稿以保持公开档案的可问责性、自由讨论副频道避免日常闲聊污染头版档案、面向校园场景的屏蔽词表、编辑后台始终可见底层匿名 ID 即便用户公开署名。

---

## Reflection / 反思

> _The author plans to fill this section in after the next CAS supervisor check-in._
> _作者将在下一次 CAS 导师沟通后补充此部分。_

### Motivation / 动机

_TODO — why this project, what problem it addresses for the school community._
_待补充 —— 为什么做这个项目,它为校园社区解决了什么问题。_

### Challenges / 挑战

_TODO — technical and non-technical challenges encountered (e.g. learning Next.js Server Components, deciding the moderation threshold, balancing anonymity with safety, designing the editorial pipeline)._
_待补充 —— 遇到的技术与非技术挑战(例如学习 Next.js 服务端组件、确定审核阈值、在匿名与安全之间取舍、设计编辑审稿流水线)。_

### Skills developed / 习得的技能

_TODO — concrete skills gained, both hard (Next.js, HMAC auth, system design, print-styled PDF) and soft (scope management, ethics-aware design, two-track product thinking)._
_待补充 —— 实际习得的能力,包括硬技能(Next.js、HMAC 认证、系统设计、打印样式 PDF)与软技能(范围管理、带伦理意识的设计、双轨产品思维)。_

### Outcomes & takeaways / 成果与体会

_TODO — what was shipped, who it serves, what was learned about responsibility, and what comes next._
_待补充 —— 最终交付了什么、服务了谁、对"责任"有什么新的理解、下一步打算做什么。_

---

## License / 许可证

MIT
