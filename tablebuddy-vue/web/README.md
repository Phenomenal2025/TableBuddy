# 开局搭子 TableBuddy · Vue 3

[中文](#中文) · [English](#english)

## 中文

中文品牌名为**开局搭子**，英文名为 **TableBuddy**。网页版中文模式同时显示两者，英文模式仅显示TableBuddy。

这是独立副本的网页部分，版本见[package.json](package.json)。前端已改为真正的Vue 3单文件组件（`.vue`），由Vite编译；教学状态、规则内容、检索和Node后端继续沿用原项目逻辑。中英切换、举例、暂停、进度恢复及日志导出均保留。

### 直接使用

安装 **Node.js 22.12或以上版本**，然后双击本目录的 `start-web.cmd`。

启动器会检查依赖；缺少依赖时自动运行 `npm ci`（需要联网），接着编译Vue页面并启动服务。首次安装可能需要稍等。浏览器会自动打开，默认地址为 `http://127.0.0.1:3186`。同项目服务可以复用，其他项目占用端口时会尝试后续端口，以窗口的Local地址为准。

也可以在本目录的终端中运行：

```powershell
npm ci
npm start
```

需要同时打开浏览器时，执行 `npm start -- --open`。

保持服务窗口打开。结束时按 `Ctrl+C`；出现 `Terminate batch job (Y/N)?`，输入 `Y` 并回车。关闭浏览器不会停止服务。启动器使用系统安装的Node。

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

版本号以各网页版的 `package.json` 为准；服务端状态接口从该文件读取版本。检查数量、通过情况与执行日期以本次命令输出和生成的报告为准。

在所选版本的 `web` 目录执行：

```powershell
npm ci
npm test
npm run test:browser
```

Vue版另提供 `npm run test:startup`，覆盖生产启动、重复启动、端口避让、开发代理及直接运行Vite。两个版本都使用项目内的Playwright；没有可用浏览器时，先运行 `npx playwright install chromium`。可用 `TABLEBUDDY_CHROME` 指定浏览器程序。

浏览器结果保存在 `test-results/browser-check/`，启动结果保存在 `test-results/startup-check/`，均由Git忽略。`TABLEBUDDY_EVIDENCE_DIR` 可覆盖结果根目录；脚本会在其下分别建立 `browser-check/` 和 `startup-check/`。生成报告记录本次执行时间。

检查覆盖教学状态、参数错误、双语提示、问答日志、重置、规则数据、限流、静态缓存和HTTP接口。模型分支使用可控模拟响应，手机布局使用浏览器尺寸模拟；真实模型、手机真机、微信内访问与真人使用效果列入后续验证。

日志覆盖开局前查询及当前教学过程，包含暂停和结束后的查询事件；导出JSON的 `setupEvents` 保存开局前事件，`session.logs` 保存教学会话事件，`phase` 标记查询阶段。重置会同时清除这些记录、问题输入和进行中的查询。

本地API支持curl等命令行工具省略Origin头。浏览器跨站来源会被拒绝；Origin校验用于浏览器来源限制。公网部署时应在网关配置身份认证和访问配额。

规则包为No Thanks!基础玩法，依据[AMIGO 2024英文规则](https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf)整理，不含特效卡。中英说明是项目教学摘要，使用前应核对实体游戏版本。

更多解释见[Vue重构说明](../vue-migration.md)。本项目尚无账号、多人同步、支付或公开部署功能。

## English

This independent edition uses Vue 3 Single-File Components (`.vue`) compiled by Vite. It retains the original teaching logic, rules, retrieval and Node API, with Chinese/English switching, examples, host confirmation, local progress and log export.

### Run and develop

Install **Node.js 22.12 or newer**. On Windows, double-click `start-web.cmd`. It installs missing dependencies with `npm ci`, builds the frontend and opens the browser. The first installation requires internet access. It uses system Node.

Alternatively, run from this directory:

```powershell
npm ci
npm start
```

Use `npm start -- --open` to open the Windows browser too. The default URL is `http://127.0.0.1:3186`; use the actual printed Local URL if another service occupies that port. Keep the terminal open, and stop with `Ctrl+C` (then `Y` if Windows prompts). Closing the browser does not stop the backend.

For hot updates while editing `.vue` files (direct `npx vite` works too):

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

Each web project's `package.json` is the version source; the server derives its status version from it. Test totals, results and execution dates come from the current run and generated reports.

From the selected edition's `web` directory:

```powershell
npm ci
npm test
npm run test:browser
```

The Vue edition also provides `npm run test:startup`, covering production startup, reuse, occupied ports, the development proxy and direct Vite invocation. Both browser suites use project-local Playwright. Run `npx playwright install chromium` if no suitable browser is installed, or set `TABLEBUDDY_CHROME` to a browser executable.

Browser evidence is written to `test-results/browser-check/`, and startup evidence to `test-results/startup-check/`. Both are ignored by Git. `TABLEBUDDY_EVIDENCE_DIR` overrides the output base; scripts create separate `browser-check/` and `startup-check/` subdirectories. Reports record their actual execution time.

Checks cover state, invalid inputs, localized feedback, question logs, reset, rule data, rolling rate limits, asset caching and HTTP behavior. Model responses are mocked and mobile layouts use viewport simulation; live models, physical phones, WeChat and real-player outcomes remain evaluation tasks.

Exports include setup queries in `setupEvents` and teaching-session events in `session.logs`, including paused and completed-session queries. Query events carry a `phase` field. Reset clears these records, the typed question and any pending request.

Local command-line clients may omit Origin. Browser cross-site requests are rejected; Origin checks restrict browser sources. Public deployments should configure authentication and access quotas at the gateway.

The candidate game is the base version of No Thanks!, summarized from [AMIGO’s 2024 English rules](https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf). Verify the physical edition before use. Neither language is an official translation.

See the [migration guide](../vue-migration.md#english) and [root README](../README.md#english). Accounts, shared multiplayer state, payments and public hosting remain unimplemented.
