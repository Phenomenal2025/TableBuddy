# 开局搭子 TableBuddy 手机网页原型

[中文](#中文) · [English](#english)

## 中文

中文品牌名为**开局搭子**，英文名为 **TableBuddy**。网页版中文模式同时显示两者，英文模式仅显示TableBuddy。

当前版本见[package.json](package.json)。沿用前期教学状态的思路，将界面改成中英双语手机网页，并增加真实HTTP后端、规则检索、模型接口适配和异常回退。页面顶部可以选择中文或English，切换时保留教学进度，并记住本机语言偏好。

### 先打开看看

1. 双击本目录的 `start-web.cmd`，浏览器会在服务准备好后自动打开；保持服务的命令窗口打开。
2. 默认地址是 `http://127.0.0.1:3186`。若同一项目已启动，会复用已有服务；若端口被其他程序占用，会尝试后续端口。以窗口实际显示的Local地址为准。
3. 选择人数和经验，点击开始；也可不开始教学，直接查询规则。
4. 没有模型配置时，页面明确显示“规则检索模式”。它会返回相关原文，不会冒充模型解释。
5. 结束预览后在命令窗口按Ctrl+C。关闭窗口后网页无法继续访问。

有Node.js 22或以上版本时，也可在本目录运行 `npm start`，无需先安装依赖。启动脚本使用系统安装的Node。移动到别的电脑时，需要自行安装Node。`npm start`只启动服务；希望同时自动打开浏览器，可运行 `node server.mjs --open`。

### 在同一Wi-Fi下用手机试

将 `.env.example` 复制成 `.env`，把 `HOST` 改成 `0.0.0.0`，重启服务。在电脑网络设置中查出本机局域网IPv4地址，例如 `192.168.1.20`；手机连接相同网络，访问 `http://192.168.1.20:3186`。这里的地址只是示例，请用自己的IP。

若窗口显示的是3187等其他端口，请把手机地址里的3186一并改为实际端口。修改过.env配置时，先关闭原服务窗口再启动，避免复用旧配置。

校园网可能隔离设备，Windows防火墙也可能阻止连接。本次验证仅为桌面Chrome和手机尺寸模拟，不是局域网手机或微信内实测。公网部署、HTTPS和微信内访问还未完成。不要把这份本地原型直接当成公开商业服务。

### 配置真实模型

默认不进行外部模型调用。模型适配依据DeepSeek的Chat Completions接口编写，使用其他兼容服务时需核对其官方文档与字段。

1. 将 `.env.example` 复制成 `.env`。
2. 在本机编辑 `.env`，填入自己的 `LLM_API_KEY`、账号实际可用的 `LLM_MODEL` 和 `LLM_API_URL`。
3. 不把密钥发到聊天里，不放在浏览器代码里，不提交 `.env`。
4. 重启服务，顶部将显示“模型已配置 · 待验证”。这只表示读到了配置，不说明调用已成功。
5. 提问后出现“模型解释”标签才表示接口返回了通过结构检查的回复；仍应核对解释与出处。出错时返回规则原文。

本次没有提供可用密钥，未进行真实付费模型调用。接口测试采用可控的模拟响应，不能作为模型质量数据。引用校验保证引用ID来自检索结果，不保证模型文字绝对符合规则。

### 架构

```text
浏览器 HTML CSS JS
  ├─ 会话状态与本机进度 → 教学 反馈 暂停 恢复 导出
  └─ POST /api/assistant
       → 检查版本与问题长度
       → 检索当前规则
       → 无配置：返回原文
       → 有配置：调用模型并核对引用
       → 失败：保留原文与人工确认提示
```

| 文件 | 负责什么 |
|---|---|
| `server.mjs` | 网页资源、问答接口、请求上限和基础限流 |
| `src/game.mjs` | 游戏版本、8条简要规则、6个教学阶段与出处 |
| `src/core.mjs` | 人数经验、状态切换、计分检查等纯逻辑 |
| `src/assistant.mjs` | 检索、模型调用、引用校验与回退 |
| `public/` | 手机和桌面界面、本机保存和日志导出 |
| `tests/app.test.mjs` | 核心逻辑、检索题、接口契约与本机HTTP测试 |
| `tests/browser-check.cjs` | 本机制作环境的Chrome交互与手机尺寸检查 |

### 游戏与规则范围

首个候选规则包是No Thanks!，依据AMIGO 2024英文规则的基础玩法整理，不含特效卡。界面中的中文是简要教学说明，不是官方中文译本。请使用自己的游戏实物并核对版本。规则来源：

[AMIGO英文规则PDF](https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf)

需要注意的细节是：拿牌后仍由该玩家翻新牌并决定；拒收才交给左边的人。模型和关键词检索都不能代替组局者处理版本差异和现场争议。

### 检查与证据

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

### 开发参考

- [Node.js HTTP](https://nodejs.org/api/http.html)
- [DeepSeek Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/)
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

版本号与实际执行时间分别见package.json和测试报告。

## English

TableBuddy is a bilingual mobile-web teaching prototype for board-game hosts. The interface provides a Chinese/English switch for the interface, teaching steps, examples, source excerpts, lookup responses and error messages. The language preference is stored in this browser; switching does not reset the current teaching step.

### Run locally

Use **Node.js 22 or later**. There are no third-party runtime dependencies to install.

On Windows, double-click `start-web.cmd` in this directory. It starts the backend and opens your browser. The launcher uses system Node. For a command-line start from this directory:

```powershell
npm start
```

To open the system browser as well:

```powershell
node server.mjs --open
```

The default address is `http://127.0.0.1:3186`. A matching running service can be reused; occupied ports cause the launcher to try later ports. Use the actual `Local` URL printed in the window. Keep that service window open. To stop, press `Ctrl+C` there and answer `Y` if Windows asks to terminate the batch job. Closing the browser does not stop the backend.

### Use a phone on the same network

Copy `.env.example` to `.env`, set `HOST=0.0.0.0`, then stop the old service and restart. Connect the phone to the same Wi-Fi and open the computer’s actual LAN IP plus the active port. For example, replace `192.168.1.20` in `http://192.168.1.20:3186` with the computer’s address. Firewall rules or campus-network isolation may prevent access. Phone and WeChat in-app testing are still pending.

### Configure an optional model

The default **Rule lookup mode** uses no model credentials. It returns matching excerpts. For model explanations, set your own `LLM_API_KEY`, `LLM_API_URL`, `LLM_MODEL` and optional `LLM_TIMEOUT_MS` in `.env`, then restart the old service. The default endpoint follows DeepSeek’s Chat Completions API. Check the provider’s official documentation when changing services.

Keep credentials on the server and exclude real `.env` files from version control. “Model configured” means configuration was found, not that the live call succeeded. Successful explanations must still be checked against the excerpts. Invalid output, missing evidence or model failure falls back to excerpts and host confirmation. English mode asks the model to respond in English; no live model quality evaluation has been completed.

### Files

| File | Responsibility |
|---|---|
| `server.mjs` | Web assets, HTTP endpoint, limits and startup handling |
| `src/game.mjs` | Versioned rules, teaching steps and Chinese/English descriptions |
| `src/core.mjs` | Teaching state transitions and scoring logic |
| `src/assistant.mjs` | Bilingual keyword retrieval, model adapter and fallback |
| `public/i18n.mjs` | Chinese and English interface text |
| `public/app.mjs` | Browser interaction, language switching, progress and requests |
| `tests/` | State, retrieval, localization, HTTP and browser checks |

Progress and event logs remain in the current browser. There is no account system, shared multiplayer state, payment or public hosting. Downloads contain teaching events, not interviews or player-performance data.

### Rules and validation

The first candidate rules package is the base game of No Thanks!, using [AMIGO’s 2024 English rulebook](https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf); special cards are excluded. Both language versions are project summaries. Verify the physical game’s edition before use.

Run the automated suite from this directory:

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

For the complete bilingual project overview, status and references, see the [root README](../README.md#english).
