# CWA Opinion Wall

A lightweight anonymous opinion wall — post, comment, tag, like, report. Built with Next.js 14 (App Router), no database, no signup, no tracking.

CWA Opinion Wall(意见墙)是一个轻量级匿名发言网站,支持发帖、评论、打标签、点赞、举报。基于 Next.js 14 构建,无数据库、无注册、无追踪。

---

## Project context — IB DP CAS / 项目背景 — IB DP CAS

> **Author / 作者:** Peter Li 李孟桐
> **Programme / 项目:** IB Diploma Programme, DP1
> **School / 学校:** CWA 世华学校
> **CAS strands / CAS 维度:** **Creativity** · **Service**

This is an IB Diploma Programme **CAS (Creativity, Activity, Service)** project — a student-built web platform offered to the school community as a free, anonymous space for sharing opinions, asking for help, venting, or celebrating small wins. It combines a **Creativity** strand (designing and engineering the platform from scratch with Next.js 14, React Server Components, and a custom moderation system) with a **Service** strand (deploying and maintaining it for fellow students, taking responsibility for content safety and accessibility).

本项目是 IB Diploma Programme **CAS(Creativity 创造、Activity 活动、Service 服务)**框架下的学生作品 —— 一个面向校园社区的匿名发言平台,免费供同学使用,可用于交流、求助、吐槽或分享好消息。它同时覆盖 **Creativity 创造**(从零设计与实现整套 Web 平台:Next.js 14、React Server Components、自研审核机制)与 **Service 服务**(对外部署、为同学持续维护、对内容安全与可用性负责)两个 CAS 维度。

---

## Features / 功能

- **Anonymous by default** — every visitor gets a stable session tag like `匿名#A1B2C3`; no signup, no email, no tracking.
- **匿名身份** — 访问即拥有形如 `匿名#A1B2C3` 的稳定会话标识,无需注册、无需邮箱、不做追踪。

- **Posts & comments** with character limits and blocked-word filter.
- **发帖与评论** — 带字数限制与屏蔽词过滤。

- **Tags** — 7 curated categories (Chat / Help / Idea / Recommend / Good news / Vent / Question) with one-click filtering.
- **预设标签** — 7 个分类:💬 闲聊 / 🆘 求助 / 💡 想法 / ❤️ 安利 / 🎉 好消息 / 😤 吐槽 / ❓ 提问,一键筛选。

- **Likes & reports** — duplicate-prevention via anonymous cookie ID.
- **点赞与举报** — 基于匿名 cookie ID 防重复。

- **Reports require a reason** — category + free-text (≤ 200 chars).
- **举报需填理由** — 6 类预设分类 + 200 字以内自定义说明。

- **Auto-hide moderation** — content auto-hides when `reports ≥ 3 && reports / (likes + reports) ≥ 0.5`. Threshold is a one-line tweak in `lib/moderation.js`.
- **自动隐藏机制** — 举报数 ≥ 3 且占比 ≥ 50% 时自动隐藏。阈值可在 [lib/moderation.js](lib/moderation.js) 中一行修改。

- **Admin Console** — pin, feature, force-show/force-hide, delete; full report queue with per-target reasons.
- **管理后台** — 置顶、加精、强制显示/隐藏、删除;举报中心可查看每条举报的具体原因。

- **i18n** — 中文 / English toggle, cookie-persisted, server-rendered (no flash of wrong language).
- **中英文切换** — cookie 持久化,服务端渲染,无语言闪烁。

- **Light & dark theme** — follows `prefers-color-scheme`. Blue & white palette.
- **深浅色主题** — 跟随系统设置,蓝白配色。

- **Mobile-friendly** — sticky frosted-glass header, responsive layout, generous touch targets.
- **移动端友好** — 毛玻璃顶栏、自适应布局、触控热区达标。

- **Zero native deps** — pure JS, single `data.json` file as storage. Drop on any machine with Node 18+.
- **零原生依赖** — 纯 JS 实现,单个 `data.json` 文件存储数据,Node 18+ 即可运行。

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
New-NetFirewallRule -DisplayName "CWA Opinion Wall 3000" `
  -Direction Inbound -LocalPort 3000 -Protocol TCP `
  -Action Allow -Profile Private,Public
```

---

## Admin / 管理员

- Default password: `admin123` — override `ADMIN_PASSWORD` in `.env.local`.
- 默认密码 `admin123`,请在 `.env.local` 中覆盖 `ADMIN_PASSWORD`。

- Login at `/admin/login` (top-right "Admin login" link).
- 登录入口:右上角"管理员登录"或访问 `/admin/login`。

- `SESSION_SECRET` should be a long random string — anyone who knows it can forge admin tokens.
- **务必修改** `SESSION_SECRET` 为一段长随机字符串,否则知道默认值的人可以伪造管理员会话。

---

## Tech stack / 技术栈

- **Next.js 14** App Router with React Server Components.
- **Next.js 14** App Router 架构,使用 React 服务端组件。

- **No DB** — `data.json` holds posts, comments, blocked words, reactions, and report records.
- **无数据库** — 单个 `data.json` 文件存放帖子、评论、屏蔽词、点赞与举报记录。

- **No client-side framework beyond React** — vanilla CSS with design tokens and dark-mode variables.
- **无额外前端框架** — 仅使用 React,样式为原生 CSS,带主题变量与深色模式适配。

---

## Project layout / 目录结构

```
app/
  _components/     client components (forms, dialogs, admin controls, i18n provider)
                   客户端组件:表单、弹窗、管理控件、i18n provider
  api/             route handlers (posts, comments, like, report, admin)
                   路由处理:发帖、评论、点赞、举报、管理接口
  admin/           admin pages (login, dashboard)
                   管理页面:登录、控制台
  post/[id]/       post detail / 帖子详情页
  layout.js        root layout + brand + lang switch + toast provider
                   根布局 + 品牌头 + 语言切换 + 全局提示
  page.js          home (post list + tag filter)
                   首页:帖子列表 + 标签筛选
  globals.css      design tokens, light/dark theme, components
                   设计变量、深浅色主题、组件样式
lib/
  db.js            JSON-file persistence + helpers / JSON 文件持久化及辅助函数
  auth.js          admin token (HMAC) + anonymous ID cookie / 管理员 HMAC 令牌 + 匿名 ID cookie
  filter.js        blocked-word check / 屏蔽词校验
  i18n.js          dictionaries (zh / en) / 中英文词典
  tags.js          curated tag list / 预设标签列表
  time.js          locale-aware relative time / 本地化相对时间
  moderation.js    auto-hide policy / 自动隐藏策略
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
| `ADMIN_PASSWORD` | `admin123` | Admin login password / 管理员登录密码 |
| `SESSION_SECRET` | `dev-secret-change-me` | HMAC key for admin session tokens / 管理员会话令牌的 HMAC 密钥 |

Moderation thresholds / 审核阈值 (in `lib/moderation.js`):

| Constant | Default | Effect / 作用 |
|---|---|---|
| `MIN_REPORTS` | `3` | Reports needed before auto-hide considered / 触发自动隐藏所需的最少举报数 |
| `HIDE_RATIO` | `0.5` | Hide when `reports / (likes + reports) ≥ this` / 当举报占比超过此值时隐藏 |

---

## Excel export / Excel 导出

Admins can export posts and reports as `.xlsx` from the admin dashboard. The export uses [`exceljs`](https://www.npmjs.com/package/exceljs) — no external service involved, the file is generated and downloaded locally.

管理员可在后台将帖子与举报导出为 `.xlsx` 文件。使用 [`exceljs`](https://www.npmjs.com/package/exceljs) 在本地生成下载,不经过任何外部服务。

---

## CAS Learning Outcomes / CAS 学习目标

This project is mapped against the following IB CAS Learning Outcomes:

本项目对应以下 IB CAS 学习目标:

### LO2 — Undertake new challenges and develop new skills / 承担新挑战、习得新技能

- **EN:** Built the platform without prior production experience in Next.js 14's App Router, React Server Components, HMAC-based session auth, or file-backed persistence patterns. Each was learned and applied iteratively across the project.
- **中文:** 项目开始前没有 Next.js 14 App Router、React 服务端组件、基于 HMAC 的会话认证、文件存储模式的实战经验,这些都是在做项目过程中边学边用、不断迭代落地的。

### LO3 — Initiate and plan a CAS experience / 自主发起并规划 CAS 体验

- **EN:** Scoped the project independently — from identifying the need (a low-friction place for students to express opinions without exposing identity), to choosing the stack, designing the moderation model, and shipping a deployable artifact.
- **中文:** 项目从问题识别(同学们需要一个无身份门槛的表达空间)到技术选型、审核机制设计、最终可部署交付,全流程由我独立规划。

### LO4 — Show commitment to and perseverance in CAS experiences / 展现承诺与坚持

- **EN:** Sustained development across the planning, build, seeding, admin tooling, Excel export, and bilingual content iterations — visible in the project's commit history.
- **中文:** 项目持续推进涵盖规划、开发、屏蔽词种子、管理后台、Excel 导出、双语内容迭代等多个阶段,提交历史可作佐证。

### LO7 — Recognise and consider the ethics of choices and actions / 认识并考量行为伦理

- **EN:** Anonymous platforms carry real ethical weight — they can empower honest voices, but also enable harassment. Decisions throughout the project (cookie-based pseudonymity instead of true anonymity, requiring a reason for every report, ratio-based auto-hide rather than first-report removal, a school-appropriate blocked-word list, and an admin audit trail) reflect deliberate tradeoffs between free expression and community safety.
- **中文:** 匿名平台天然带有伦理重量 —— 它既能让真实声音被听见,也可能被滥用为骚扰工具。项目中的多项设计决策(用 cookie 化名而非完全匿名、举报必须填理由、按"举报/点赞"比例触发自动隐藏而非首报即删、面向校园场景的屏蔽词表、管理员操作留痕)都是在表达自由与社区安全之间反复权衡的结果。

---

## Reflection / 反思

> _The author plans to fill this section in after the next CAS supervisor check-in._
> _作者将在下一次 CAS 导师沟通后补充此部分。_

### Motivation / 动机

_TODO — why this project, what problem it addresses for the school community._
_待补充 —— 为什么做这个项目,它为校园社区解决了什么问题。_

### Challenges / 挑战

_TODO — technical and non-technical challenges encountered (e.g. learning Next.js Server Components, deciding the moderation threshold, balancing anonymity with safety)._
_待补充 —— 遇到的技术与非技术挑战(例如学习 Next.js 服务端组件、确定审核阈值、在匿名与安全之间取舍)。_

### Skills developed / 习得的技能

_TODO — concrete skills gained, both hard (Next.js, HMAC auth, system design) and soft (scope management, ethics-aware design)._
_待补充 —— 实际习得的能力,包括硬技能(Next.js、HMAC 认证、系统设计)与软技能(范围管理、带伦理意识的设计)。_

### Outcomes & takeaways / 成果与体会

_TODO — what was shipped, who it serves, what was learned about responsibility, and what comes next._
_待补充 —— 最终交付了什么、服务了谁、对"责任"有什么新的理解、下一步打算做什么。_

---

## License / 许可证

MIT
