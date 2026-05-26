# CWA Opinion Wall

A lightweight anonymous opinion wall — post, comment, tag, like, report. Built with Next.js 14 (App Router), no database, no signup, no tracking.

[简体中文](#中文说明) · English below

---

## Features

- **Anonymous by default** — every visitor gets a stable session tag like `匿名#A1B2C3`; no signup, no email, no tracking.
- **Posts & comments** with character limits and blocked-word filter.
- **Tags** — 7 curated categories (Chat / Help / Idea / Recommend / Good news / Vent / Question) with one-click filtering.
- **Likes & reports** — duplicate-prevention via anonymous cookie ID.
- **Reports require a reason** — category + free-text (≤ 200 chars).
- **Auto-hide moderation** — content auto-hides when `reports ≥ 3 && reports / (likes + reports) ≥ 0.5`. Threshold is a one-line tweak in `lib/moderation.js`.
- **Admin Console** — pin, feature, force-show/force-hide, delete; full report queue with per-target reasons.
- **i18n** — 中文 / English toggle, cookie-persisted, server-rendered (no flash of wrong language).
- **Light & dark theme** — follows `prefers-color-scheme`. Blue & white palette.
- **Mobile-friendly** — sticky frosted-glass header, responsive layout, generous touch targets.
- **Zero native deps** — pure JS, single `data.json` file as storage. Drop on any machine with Node 18+.

## Quick start

```bash
npm install
cp .env.example .env.local   # edit ADMIN_PASSWORD and SESSION_SECRET
npm run dev                  # localhost only
# or
npm run dev:lan              # bind 0.0.0.0 for LAN access
```

Open http://localhost:3000

## Production

```bash
npm run build
npm run start:lan            # bind 0.0.0.0
```

## Admin

- Default password: `admin123` (override `ADMIN_PASSWORD` in `.env.local`)
- Login at `/admin/login`
- `SESSION_SECRET` should be a long random string — anyone who knows it can forge admin tokens

## Tech stack

- **Next.js 14** App Router, React Server Components
- **No DB** — `data.json` for posts, comments, blocked words, reactions, report records
- **No client-side framework** beyond React; vanilla CSS with design tokens & dark-mode variables

## Project layout

```
app/
  _components/     client components (forms, dialogs, admin controls, i18n provider)
  api/             route handlers (posts, comments, like, report, admin)
  admin/           admin pages (login, dashboard)
  post/[id]/       post detail
  layout.js        root layout + brand + lang switch + toast provider
  page.js          home (post list + tag filter)
  globals.css      design tokens, light/dark theme, components
lib/
  db.js            JSON-file persistence + helpers
  auth.js          admin token (HMAC) + anonymous ID cookie
  filter.js        blocked-word check
  i18n.js          dictionaries (zh / en)
  tags.js          curated tag list
  time.js          locale-aware relative time
  moderation.js    auto-hide policy
```

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `ADMIN_PASSWORD` | `admin123` | Admin login password |
| `SESSION_SECRET` | `dev-secret-change-me` | HMAC key for admin session tokens |

| `lib/moderation.js` constant | Default | Effect |
|---|---|---|
| `MIN_REPORTS` | `3` | Reports needed before auto-hide considered |
| `HIDE_RATIO` | `0.5` | Hide when `reports / (likes + reports) ≥ this` |

## License

MIT

---

## 中文说明

CWA Opinion Wall（意见墙）是一个轻量级匿名发言网站，支持发帖、评论、打标签、点赞、举报。基于 Next.js 14，无数据库、无注册、无追踪。

### 功能

- **匿名身份**：访问即拥有形如 `匿名#A1B2C3` 的稳定会话标识，无需注册
- **发帖与评论**：字数限制 + 屏蔽词过滤
- **7 个预设标签**：💬 闲聊 / 🆘 求助 / 💡 想法 / ❤️ 安利 / 🎉 好消息 / 😤 吐槽 / ❓ 提问，可一键筛选
- **点赞与举报**：基于匿名 cookie 防重复
- **举报需填理由**：6 类预设 + 200 字以内自定义说明
- **自动隐藏**：举报数 ≥ 3 且占比 ≥ 50% 时自动隐藏（阈值在 `lib/moderation.js` 调）
- **管理后台**：置顶、精华、强制显示/隐藏、删除；举报中心展示所有举报原因
- **中英文切换**：cookie 持久化，服务端渲染无闪烁
- **深浅色主题**：跟随系统，蓝白配色
- **移动端友好**：毛玻璃顶栏、自适应布局、触控热区达标
- **零原生依赖**：纯 JS，单个 `data.json` 文件存数据

### 快速启动

```bash
npm install
# 编辑 .env.local 设置 ADMIN_PASSWORD 和 SESSION_SECRET
npm run dev       # 本机
npm run dev:lan   # 局域网开放
```

打开 http://localhost:3000

### 生产部署

```bash
npm run build
npm run start:lan
```

防火墙放行 TCP 3000（管理员 PowerShell）：

```powershell
New-NetFirewallRule -DisplayName "CWA Opinion Wall 3000" `
  -Direction Inbound -LocalPort 3000 -Protocol TCP `
  -Action Allow -Profile Private,Public
```

### 管理员

- 默认密码：`admin123`
- 登录入口：右上角 "管理员登录" 或 `/admin/login`
- **务必修改** `.env.local` 中的 `SESSION_SECRET`，否则任何人知道默认密钥都能伪造管理员会话
