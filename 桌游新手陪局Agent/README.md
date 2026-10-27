# 开局搭子 TableBuddy

[中文](#中文) · [English](#english)

## 中文

中文品牌名为**开局搭子**，英文名为 **TableBuddy**。网页版中文模式同时显示两者，英文模式仅显示TableBuddy。

面向青年桌游组局者的手机网页带新助手。

开局搭子（TableBuddy）把新游戏的学习过程拆成简短的教学步骤，支持按需举例、回看、规则查询和人工确认，帮助组局者带新人完成第一轮游戏。项目优先关注中国大陆青年线下聚会的使用场景，以一桌共用一台设备的方式降低操作负担。

当前为课程实践原型，版本为 **0.3.0**。已完成中英双语手机网页、教学状态管理、规则检索后端和可配置的模型接口；尚未公开部署，真实模型联调及真人使用效果仍待验证。

![开局搭子 TableBuddy 桌面界面](docs/images/desktop.png)

### 项目目标

- 帮助新手从了解目标、准备游戏到尝试合法行动，逐步学会第一局。
- 减少组局者的重复解释，同时保留人与人交流和判断的空间。
- 通过真实试用，比较教学耗时、规则错误、操作负担与再次使用意愿，并探索按场付费的可能性。

项目的技术路线根据前期调研，从微信小程序调整为手机适配网页，以便开展现场试用和快速修改。前期小程序原型保留在仓库中。

### 主要功能

| 功能 | 当前实现 |
|---|---|
| 中英切换 | 顶部选择中文或English，教学进度与已展开例子保留；记住本机语言偏好 |
| 分步教学 | 依次介绍目标、准备、行动、回合交接、计分和首轮练习 |
| 按经验调整说明 | 新手使用完整解释，熟手使用简版说明 |
| 教学反馈 | 支持举例、回看、暂停，组局者确认后继续 |
| 规则检索 | 根据问题检索当前版本的规则条目，并显示出处及PDF页码 |
| 可选模型解释 | 配置服务端模型后请求解释；异常时回退到规则原文 |
| 本机进度 | 保存未结束的教学进度，刷新后可恢复 |
| 记录导出 | 导出本机教学事件，便于复查操作过程 |
| 启动处理 | 同项目服务复用，端口冲突时自动尝试后续端口 |

<details>
<summary>查看手机尺寸界面</summary>

<p align="center">
  <img src="docs/images/mobile.png" alt="开局搭子 TableBuddy 手机尺寸教学界面" width="320">
</p>

</details>

### 快速开始

#### 环境要求

- Node.js **22或以上版本**。
- 支持JavaScript模块的现代浏览器。
- 当前运行时不依赖第三方npm包，无需先执行 `npm install`。

#### Windows启动

进入 `网页实现` 文件夹，双击：

```text
start-web.cmd
```

服务准备好后会自动打开浏览器。默认访问地址为：

```text
http://127.0.0.1:3186
```

如果该端口已被其他程序占用，启动器会尝试后续端口，请以窗口显示的 `Local` 地址为准。服务运行期间保持命令窗口打开；关闭网页不会停止后端，在服务窗口按 `Ctrl+C` 可以停止服务。出现 `Terminate batch job (Y/N)?` 时，输入 `Y` 并回车。

启动脚本优先使用本机已有的Codex配套Node，找不到时使用系统Node。其他电脑安装Node后，也可以直接使用下面的命令。

#### 命令行启动

在仓库根目录执行：

```powershell
cd "网页实现"
npm start
```

希望同时自动打开Windows默认浏览器时，可执行：

```powershell
node server.mjs --open
```

#### 手机访问

默认服务只允许本机访问。同一Wi-Fi下使用手机测试时，在 `网页实现` 目录把 `.env.example` 复制为 `.env`，设置：

```dotenv
HOST=0.0.0.0
PORT=3186
```

重启服务后，用手机访问电脑的局域网IP和实际端口，例如 `http://192.168.1.20:3186`。请将示例IP替换为电脑的实际地址。校园网设备隔离或防火墙设置可能影响连接。

### 模型配置与运行模式

默认情况下，项目可以在没有模型密钥的环境下运行，页面显示 **规则检索模式**。该模式返回匹配的规则条目，不生成模型解释。

如需模型解释，在 `网页实现/.env` 中配置自己的服务端参数：

```dotenv
LLM_API_KEY=your_api_key_here
LLM_API_URL=https://api.deepseek.com/chat/completions
LLM_MODEL=your_available_model_name
LLM_TIMEOUT_MS=12000
```

密钥和模型名称需要自行替换；修改配置后，先停止旧服务再启动。适配器参考DeepSeek Chat Completions接口实现，接入其他服务前应核对其官方接口要求。

后端会检查问题长度、游戏版本、模型返回格式与引用ID。没有依据、模型不可用或引用不匹配时，会保留规则原文并提示人工确认。**引用ID有效不等于解释一定正确，仍需核对规则。**

真实 `.env` 不应提交到Git仓库；仓库仅保留不含密钥的 `.env.example`。

### 系统结构

```mermaid
flowchart TD
    A[手机或电脑浏览器] --> B[教学状态与本机进度]
    B --> C[继续 举例 回看 暂停 导出]
    A --> D[问答HTTP接口]
    D --> E[当前版本规则检索]
    E --> F{是否配置模型}
    F -->|否| G[返回规则原文]
    F -->|是| H[服务端模型调用]
    H --> I[格式与引用检查]
    I -->|通过| J[解释与规则出处]
    I -->|失败| G
```

前端采用HTML、CSS和JavaScript，后端采用Node.js原生HTTP模块。教学进度由明确的状态数据维护，模型不直接决定玩家是否完成教学。

### 仓库目录

```text
.
├─ README.md                  项目介绍与快速开始
├─ docs/images/               GitHub首页展示图片
├─ 网页实现/                  当前主要开发版本
│  ├─ public/                 页面、样式与浏览器交互
│  ├─ src/
│  │  ├─ game.mjs             游戏规则、教学步骤与出处
│  │  ├─ core.mjs             教学状态与计分逻辑
│  │  └─ assistant.mjs        规则检索、模型适配与回退
│  ├─ tests/                  自动化测试和浏览器检查脚本
│  ├─ server.mjs              网页与API服务
│  ├─ start-web.cmd           Windows启动入口
│  └─ .env.example            配置示例
├─ 小程序初步实现/            第3～4周原型
├─ 参考资料/                  课程要求等材料
└─ 双周报告与协作说明         阶段成果文档
```

详细配置与实现说明见[网页版说明](网页实现/README.md)，阶段分工见[第5～6周架构与协作记录](../报告/第5至6周_架构与协作记录.md)。

### 规则与内容范围

首个候选规则包为 **No Thanks! 基础玩法**，依据[AMIGO 2024英文规则](https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf)整理，不包含特效卡。页面中英文说明均为本项目的简要教学整理，不代替官方规则。线下使用前，应与实际持有的游戏及规则版本核对。

项目提供教学和规则查询，不模拟完整棋盘、不记录全部玩家行动，也不替玩家作策略决定。

### 测试与当前进展

在 `网页实现` 目录执行：

```powershell
npm test
```

截至 **2026年10月27日**：

- **63项自动化检查通过**，覆盖教学状态、计分、版本约束、中英切换、检索、模型接口契约、异常回退、HTTP服务与启动器。
- 其中包含 **32条构造的检索检查题**，属于开发样例，不是用户样本。
- **19项浏览器流程检查通过**，包含中英文桌面与手机尺寸页面、语言偏好、查询途中切换语言及错误提示；检查宽度为360、390、430像素。
- 模型接口检查使用模拟响应；尚未完成真实模型联调、手机真机与微信内访问测试，也未取得真人教学效果或付费数据。

`tests/browser-check.cjs` 使用本机制作环境的Chrome与Playwright路径，在其他电脑运行前需要调整。首页图片来自本机浏览器自动化截图，其中手机图为尺寸模拟。

### 后续计划

1. 完成真实模型联调，增加不同问法与复杂规则问题的检查。
2. 核对实体游戏版本，进行手机及微信内访问测试。
3. 组织真实新手局，记录教学耗时、重复解释、规则错误和操作负担。
4. 根据反馈修订流程，再验证组局者的再次使用与按场付费意愿。

目前没有账号系统、多人同步、在线支付或公开部署功能。GitHub用于管理和展示源码；上传仓库不会自动启动本项目的Node后端。

### 实践与协作

项目发起人负责使用场景、目标人群和产品路线的判断，调研后提出从小程序转向手机适配网页。AI参与架构设计、代码生成与调整、规则整理和自动化检查。真人访谈、现场试玩和实际付费验证需要独立收集证据，不以代码测试替代。

### 参考资料

- [Node.js HTTP文档](https://nodejs.org/api/http.html)
- [DeepSeek Chat Completions接口](https://api-docs.deepseek.com/api/create-chat-completion/)
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## English

TableBuddy is a mobile-friendly board-game teaching assistant for young people who host game nights.

It breaks the first game into short teaching steps, with optional examples, previous-step review, rule lookup and host confirmation. The initial focus is on young adults playing together in mainland China, sharing one device at the table.

**Current version: 0.3.0 — student project prototype.** A bilingual web interface, teaching-state management, rule-retrieval backend and configurable model adapter are implemented. The project has not been publicly deployed; live model integration and effectiveness with real players still need validation.

![TableBuddy English desktop interface](docs/images/desktop-en.png)

### Goals

- Help new players move from understanding the objective and setup to trying a legal action.
- Reduce repeated explanations for the host while keeping discussion and judgment at the table.
- Evaluate teaching time, rule mistakes, interaction burden and reuse intent through real sessions, and explore payment per session.

Following the project initiator’s research, the implementation shifted from a WeChat Mini Program to a mobile-friendly website for easier field testing and iteration. The earlier Mini Program prototype remains in this repository.

### Features

| Feature | Current implementation |
|---|---|
| Chinese and English | Switch languages in the header without losing the teaching step or expanded example; remember the preference in this browser |
| Guided teaching | Objective, setup, actions, turn handover, scoring and a practice round |
| Experience-aware text | Full explanations for new players and shorter text for experienced players |
| Teaching feedback | Examples, previous-step review, pause and host-confirmed resume |
| Rule lookup | Retrieve rule excerpts for the selected edition, with source IDs and PDF page links |
| Optional model explanations | Call a server-configured model; fall back to rule excerpts when unavailable |
| Local progress | Save an unfinished guide and restore it after reloading |
| Event export | Export local teaching events for review |
| Startup handling | Reuse a matching running service, or try another port when necessary |

Chinese and English questions can be entered in either interface language. Returned excerpts and guidance follow the selected interface language. Changing language clears a previous answer so the question can be submitted again; it does not reset teaching progress. When a model is configured, its prompt requests the selected output language, but the actual reply still needs validation.

<details>
<summary>English mobile-size preview</summary>

<p align="center">
  <img src="docs/images/mobile-en.png" alt="TableBuddy teaching interface at a mobile viewport size" width="320">
</p>

</details>

### Quick start

Requirements: **Node.js 22 or later** and a modern browser with JavaScript module support. The current runtime has no third-party npm dependencies, so `npm install` is not required.

On Windows, open the `网页实现` folder and double-click `start-web.cmd`. The browser opens after the service is ready. The default address is:

```text
http://127.0.0.1:3186
```

If the port is occupied, the launcher tries later ports. Use the actual `Local` address printed in the window. Keep the service window open. Closing the browser does not stop the backend; press `Ctrl+C` in the service window to stop it. If Windows asks `Terminate batch job (Y/N)?`, type `Y` and press Enter.

The Windows launcher first tries the Node runtime bundled with Codex on the current computer, then system Node. On another computer, install Node and run from the repository root:

```powershell
cd "网页实现"
npm start
```

To also open the Windows default browser automatically:

```powershell
node server.mjs --open
```

For a phone on the same Wi-Fi network, copy `网页实现/.env.example` to `网页实现/.env`, set `HOST=0.0.0.0`, and restart the old service. Open the computer’s actual LAN IP and active port on the phone, for example `http://192.168.1.20:3186`. Replace this example IP with your computer’s address. Campus-network isolation and firewall rules may prevent the connection. `127.0.0.1` on a phone refers to the phone itself, not your computer.

### Model setup and operating modes

Without model credentials, the website runs in **Rule lookup mode**. It returns matching excerpts without generating a model explanation.

For optional model explanations, configure your own server-side values in `网页实现/.env`:

```dotenv
LLM_API_KEY=your_api_key_here
LLM_API_URL=https://api.deepseek.com/chat/completions
LLM_MODEL=your_available_model_name
LLM_TIMEOUT_MS=12000
```

Replace the placeholders with your own credentials and an available model name. Stop the old service before restarting after configuration changes. The adapter follows DeepSeek’s Chat Completions interface; check the provider’s official documentation before using another service.

The backend checks question length, game version, output structure and source IDs. Missing evidence, model failures or invalid citations trigger a fallback to excerpts and host confirmation. **A valid source ID does not guarantee that the explanation is correct.**

Never commit your real `.env`. The repository keeps only `.env.example`, without working credentials.

### Architecture

```mermaid
flowchart TD
    A[Phone or desktop browser] --> B[Teaching state and local progress]
    B --> C[Continue Example Review Pause Export]
    A --> D[Question HTTP endpoint]
    D --> E[Retrieve current-edition rules]
    E --> F{Model configured?}
    F -->|No| G[Return rule excerpts]
    F -->|Yes| H[Server-side model call]
    H --> I[Validate structure and source IDs]
    I -->|Valid| J[Explanation with sources]
    I -->|Invalid| G
```

The frontend uses HTML, CSS and JavaScript. The backend uses Node.js’s native HTTP module. Explicit state data controls teaching progress; the model does not decide whether players have completed the guide. UI text is centralized in `public/i18n.mjs`.

### Repository guide

| Path | Purpose |
|---|---|
| `README.md` | Bilingual project overview and quick start |
| `docs/images/` | Screenshots displayed on the repository homepage |
| `网页实现/public/` | Responsive UI, translations, browser interaction and local storage |
| `网页实现/src/game.mjs` | Versioned rules, teaching steps and their Chinese/English descriptions |
| `网页实现/src/core.mjs` | Teaching state and scoring logic |
| `网页实现/src/assistant.mjs` | Rule retrieval, model adapter and fallbacks |
| `网页实现/server.mjs` | Web assets and API service |
| `网页实现/tests/` | Logic, HTTP, localization and browser checks |
| `小程序初步实现/` | Earlier Mini Program prototype |
| `参考资料/` | Course requirements and supporting materials |

See the [web implementation guide](网页实现/README.md) and the [weeks 5–6 collaboration record](../报告/第5至6周_架构与协作记录.md) for implementation context. The collaboration record is currently in Chinese.

### Game and content scope

The first candidate rules package is **No Thanks!, base game**, based on [AMIGO’s 2024 English rules](https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf). Special cards are excluded. Both language versions are concise teaching summaries prepared for this project, not replacements for the official rulebook. Check the edition of the physical game before using the guide.

The project teaches and looks up rules. It does not simulate the whole game, record every player’s move or choose strategies for players.

### Validation and current status

From `网页实现`, run:

```powershell
npm test
```

As of **27 October 2026**:

- **63 automated checks passed**, covering state, scoring, versions, localization, retrieval, model contracts, fallbacks, HTTP handling and startup behavior.
- The suite includes **32 constructed retrieval questions**, which are development examples rather than participant data.
- **19 browser-flow checks passed**, covering Chinese/English desktop and mobile-size layouts, language persistence, language changes during a request and error messages. Checked widths are 360, 390 and 430 pixels.
- Model tests use controlled mock responses. Live model quality, physical phones, WeChat’s in-app browser, real-player teaching outcomes and payment have not been validated.

`tests/browser-check.cjs` uses local Chrome and Playwright paths from the authoring environment; adjust those paths on another computer. Screenshots come from the local browser; mobile images are viewport simulations.

### Next steps

1. Connect and evaluate a real model, including varied phrasings and more complex questions.
2. Verify the physical game edition and test phones and WeChat’s in-app browser.
3. Run real newcomer sessions and record teaching time, repeated explanations, rule mistakes and interaction burden.
4. Refine the guide and test hosts’ willingness to reuse or pay per session.

Accounts, cross-device synchronization, online payments and public deployment are not implemented. GitHub hosts the repository; pushing this code does not automatically run its Node backend.

### Practice and collaboration

The project initiator defines the audience and product direction and proposed the mobile-web route after research. AI contributes architecture proposals, code generation and revisions, rule organization and automated checks. Interviews, field sessions and payment validation require their own real-world evidence.

### References

- [Node.js HTTP documentation](https://nodejs.org/api/http.html)
- [DeepSeek Chat Completions API](https://api-docs.deepseek.com/api/create-chat-completion/)
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
