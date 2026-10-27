# 开局搭子 TableBuddy · Vue 3

[中文](#中文) · [English](#english)

## 中文

中文品牌名为**开局搭子**，英文名为 **TableBuddy**。网页版中文模式同时显示两者，英文模式仅显示TableBuddy。

这是独立副本的网页部分，版本 **0.4.0**。前端已改为真正的Vue 3单文件组件（`.vue`），由Vite编译；教学状态、规则内容、检索和Node后端继续沿用原项目逻辑。中英切换、举例、暂停、进度恢复及日志导出均保留。

### 直接使用

安装 **Node.js 22.12或以上版本**，然后双击本目录的 `start-web.cmd`。

启动器会检查依赖；缺少依赖时自动运行 `npm ci`（需要联网），接着编译Vue页面并启动服务。首次安装可能需要稍等。浏览器会自动打开，默认地址为 `http://127.0.0.1:3186`。同项目服务可以复用，其他项目占用端口时会尝试后续端口，以窗口的Local地址为准。

也可以在本目录的终端中运行：

```powershell
npm ci
npm start
```

需要同时打开浏览器时，执行 `npm start -- --open`。

保持服务窗口打开。结束时按 `Ctrl+C`；出现 `Terminate batch job (Y/N)?`，输入 `Y` 并回车。关闭浏览器不会停止服务。启动器优先使用本机Codex配套Node，找不到时使用系统Node。

### 修改代码

```powershell
npm run dev
```

打开终端显示的开发地址，通常是 `http://127.0.0.1:5173`。Vite负责实时编译，修改 `.vue` 后页面自动更新；`/api` 请求通过开发代理转发到本地Node后端。端口占用时地址可能变化。

`npm start` 是“先编译，再运行”：修改源码后需要重新启动。`npm run build` 只生成 `dist/`；已构建的页面可以通过 `node server.mjs` 直接运行。不要直接双击 `index.html` 或 `.vue` 文件。

### 文件怎么找

| 文件 | 作用 |
|---|---|
| `src/App.vue` | 页面总装、教学与问答区域组合 |
| `src/components/HeaderBar.vue` | 品牌、服务状态、语言选择 |
| `src/components/SetupPanel.vue` | 人数、经验、开始与恢复 |
| `src/components/LessonPanel.vue` | 教学步骤、举例、暂停和出处 |
| `src/components/CompletePanel.vue` | 教学结束与重新开始 |
| `src/components/RuleAssistant.vue` | 规则查询、回复及错误提示 |
| `src/components/RuleSources.vue` | 可复用的出处列表 |
| `src/composables/useLocale.mjs` | 中英语言和本机偏好 |
| `src/composables/useTeaching.mjs` | 响应式教学状态、保存、恢复、导出 |
| `src/composables/useAssistant.mjs` | 查询请求、超时及取消旧回复 |
| `src/i18n.mjs`、`src/styles.css` | 中英界面文案和全局样式 |
| `src/game.mjs`、`src/core.mjs` | 游戏规则与不依赖Vue的教学逻辑 |
| `src/assistant.mjs` | 服务端检索、模型适配及回退 |
| `scripts/start.mjs`、`scripts/dev.mjs` | 自动编译启动与开发服务 |
| `server.mjs` | 编译资源和HTTP接口；不公开源码与配置 |

### 手机与模型配置

将 `.env.example` 复制成 `.env`。同一Wi-Fi的手机访问时设置 `HOST=0.0.0.0`，重启后访问电脑的实际局域网IP和终端显示的端口；手机上的127.0.0.1指向手机自己。防火墙和校园网隔离可能影响连接。

默认不调用模型，页面标记“规则检索模式”。需要模型解释时，在服务端 `.env` 中设置自己的 `LLM_API_KEY`、`LLM_API_URL`、`LLM_MODEL`，再停止旧服务并启动。模型配置存在不代表调用已经验证成功。当前使用DeepSeek Chat Completions形式的适配器，更换服务前应核对其官方接口。

模型失败、缺少依据或引用不匹配时回退到规则片段。引用ID通过检查不保证文字正确，仍需组局者核对。`.env` 只放服务端，不提交Git；Vue页面不会获得模型密钥。

### 验证

```powershell
npm test
npm run test:browser
npm run test:startup
```

2026年10月27日，本副本通过 **68项自动化检查、22项浏览器流程检查和6项启动检查**。浏览器测试使用项目内Playwright，优先寻找系统Chrome／Edge，也可通过 `TABLEBUDDY_CHROME` 指定路径。没有可用浏览器时先运行 `npx playwright install chromium`。

结果与截图保存在 `../制作与排版资料/Vue重构检查/`。32条检索题是构造的开发样例，模型接口测试使用模拟响应；手机图片是尺寸模拟，尚未验证手机真机、微信内浏览器或真实模型效果。教学事件导出不是访谈记录或学习成绩。

规则包为No Thanks!基础玩法，依据[AMIGO 2024英文规则](https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf)整理，不含特效卡。中英说明是项目教学摘要，使用前应核对实体游戏版本。

更多解释见[Vue重构说明](../Vue重构说明.md)。本项目尚无账号、多人同步、支付或公开部署功能。

## English

This independent **0.4.0** edition uses Vue 3 Single-File Components (`.vue`) compiled by Vite. It retains the original teaching logic, rules, retrieval and Node API, with Chinese/English switching, examples, host confirmation, local progress and log export.

### Run and develop

Install **Node.js 22.12 or newer**. On Windows, double-click `start-web.cmd`. It installs missing dependencies with `npm ci`, builds the frontend and opens the browser. The first installation requires internet access. It prefers Codex’s bundled Node when available, then system Node.

Alternatively, run from this directory:

```powershell
npm ci
npm start
```

Use `npm start -- --open` to open the Windows browser too. The default URL is `http://127.0.0.1:3186`; use the actual printed Local URL if another service occupies that port. Keep the terminal open, and stop with `Ctrl+C` (then `Y` if Windows prompts). Closing the browser does not stop the backend.

For hot updates while editing `.vue` files:

```powershell
npm run dev
```

Open the printed Vite URL, usually `http://127.0.0.1:5173`. API requests are proxied to the local backend. `npm start` builds before serving and requires a restart after source changes. `npm run build` produces `dist/`; after building, `node server.mjs` serves that output directly. Do not open `.vue` or the source HTML as local files.

### Structure

`src/App.vue` composes six components in `src/components/`: header, setup, lesson, completion, rule lookup and reusable source lists. `src/composables/` manages locale, teaching state/storage and cancellable requests. `src/i18n.mjs` contains UI translations and `src/styles.css` contains responsive styling.

`src/game.mjs` and `src/core.mjs` remain framework-independent. `src/assistant.mjs` is server-only. `server.mjs` serves compiled browser assets and API routes; source files, credentials and dependencies are not exposed by its static routes. `scripts/` provides build-and-start and development modes.

### Configuration

Copy `.env.example` to `.env`. To test from a phone on the same Wi-Fi, set `HOST=0.0.0.0`, restart, and use the computer’s actual LAN IP and active port. Firewall rules or campus isolation may block access.

Default Rule lookup mode requires no model key. Optional model explanations use server-side `LLM_API_KEY`, `LLM_API_URL` and `LLM_MODEL`; restart the old service after changes. The adapter follows the DeepSeek Chat Completions format. Check the chosen provider’s official API before changing services. Keep `.env` out of Git and browser code.

Missing evidence, invalid citations and model failures fall back to rule excerpts. Valid source IDs do not guarantee a correct explanation. Live model behavior still needs validation.

### Validation

```powershell
npm test
npm run test:browser
npm run test:startup
```

On October 27, 2026, **68 automated checks, 22 browser-flow checks and 6 launcher checks passed**. Browser tests use the local Playwright dependency and installed Chrome/Edge; `TABLEBUDDY_CHROME` can override the executable path. If no suitable browser is installed, run `npx playwright install chromium`.

Evidence is in `../制作与排版资料/Vue重构检查/`. The 32 retrieval questions are constructed development examples. Model responses are mocked; mobile screenshots simulate viewport sizes. No real-device, WeChat, live model, user outcome or payment validation has been completed.

The candidate game is the base version of No Thanks!, summarized from [AMIGO’s 2024 English rules](https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf). Verify the physical edition before use. Neither language is an official translation.

See the [migration guide](../Vue重构说明.md#english) and [root README](../README.md#english). Accounts, shared multiplayer state, payments and public hosting remain unimplemented.
