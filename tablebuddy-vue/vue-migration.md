# TableBuddy Vue重构说明 / Vue Migration Guide

[中文](#中文) · [English](#english)

## 中文

### 这份副本是什么

`tablebuddy-vue` 是从原项目复制出来的独立版本。两个网页版分别保留自己的实现；课程报告在仓库外的本地材料中保留。复制时排除了Git历史、实际 `.env`、依赖目录和构建缓存；需要模型配置时，在副本中自行填写 `.env`。

当前网页版本为0.4.0。之前的报告和“第5至6周”记录描述当时的实现，未改写为Vue版本；当前实现以本说明及两个README为准。

### `.vue` 到底改变了什么

原来的页面在HTML里放好元素，再由 `app.mjs` 查找按钮、监听点击、修改文字。现在一个界面区域对应一个 `.vue` 文件：

```vue
<script setup>
// 数据、导入、事件处理
</script>

<template>
  <!-- 界面；根据数据自动更新 -->
</template>
```

布局沿用原来的全局 `styles.css`。需要单个组件专用样式时，可以在该组件中增加 `<style scoped>`。

例如 `SetupPanel.vue` 里的 `v-model.number="players"` 让人数选择与变量绑定；`@submit.prevent` 处理表单提交；`emit('start', players, experience)` 把选择交给父组件。`App.vue` 接到事件后创建教学状态，页面就从开局设置切换到教学组件。

这不是给旧文件改后缀：界面现在由Vue模板渲染，组件之间用属性和事件传递信息，状态通过响应式数据更新。

### 现在的结构

```text
web/
├─ index.html                 浏览器入口，只留Vue挂载点
├─ vite.config.mjs            .vue编译配置
├─ package.json               依赖和运行命令
├─ package-lock.json          锁定安装版本
├─ scripts/
│  ├─ start.mjs               安装检查、编译、启动
│  └─ dev.mjs                 Vue开发服务及API代理
├─ src/
│  ├─ main.mjs                把App.vue挂到页面上
│  ├─ App.vue                 组合整个页面
│  ├─ components/             6个界面组件
│  ├─ composables/            语言、教学和问答状态
│  ├─ i18n.mjs                中英界面文案
│  ├─ styles.css              保留原有配色与手机适配
│  ├─ game.mjs                规则、步骤、出处
│  ├─ core.mjs                教学状态与计分逻辑
│  └─ assistant.mjs           服务端规则检索及模型适配
├─ server.mjs                 编译资源和API服务
├─ start-web.cmd              Windows双击入口
└─ tests/                     自动化、浏览器、启动检查
```

### 常见修改去哪里

| 想改什么 | 主要文件 |
|---|---|
| 标题、按钮、中英提示 | `src/i18n.mjs` |
| 开局表单 | `src/components/SetupPanel.vue` |
| 教学区域 | `src/components/LessonPanel.vue` |
| 查询框和回复 | `src/components/RuleAssistant.vue` |
| 页面排列 | `src/App.vue` |
| 颜色、字号、手机布局 | `src/styles.css` |
| 教学步骤、例子与依据 | `src/game.mjs` |
| 下一步、暂停等行为 | `src/core.mjs` |
| 保存和恢复进度 | `src/composables/useTeaching.mjs` |
| 请求超时与语言切换取消 | `src/composables/useAssistant.mjs` |

`ref` 表示会影响界面的数据，`computed` 表示从现有数据计算出来的内容，`watch` 用来处理语言改变等副作用。教学会话使用 `shallowRef`：每次状态切换生成一个新对象，同时避免把Vue代理对象交给原逻辑中的 `structuredClone`。

### 启动后怎么运转

1. 双击 `start-web.cmd`，找到Node，再运行 `scripts/start.mjs`。
2. 缺少依赖时运行 `npm ci`；随后Vite把 `.vue` 编译成浏览器能执行的JavaScript和CSS，放进 `dist/`。
3. Node服务从 `dist/` 返回页面和资源，同时提供 `/api/status` 与 `/api/assistant`。
4. 浏览器加载Vue，显示 `App.vue` 组合的界面。点击教学按钮主要在浏览器本地处理；规则查询才请求后端。
5. 后端检索当前规则，按配置选择是否调用模型；模型密钥不发送给浏览器。

`npm run dev` 则启动Vite开发服务，通常使用5173端口，API代理连接本地Node后端。它适合边改边看。`npm start` 适合实际演示，修改代码后重新启动才会编译新页面。

运行中的原项目与Vue副本通过文件夹指纹和版本区分。端口冲突时Vue副本尝试后续端口，不会误用原项目服务。浏览器进度按访问来源（协议、主机、端口）存储；换到另一个端口，通常需要重新开始，两个版本不会自动同步进度。

### 已验证与待验证

- 68项自动化检查通过，包含5项新增的Vue状态与请求检查。
- 22项浏览器流程检查通过，覆盖中英切换、手机宽度、进度、错误、禁用存储及重置取消请求。
- 6项启动检查通过，包含编译启动、模拟旧服务占端口、重复启动复用、开发代理及停止服务。
- 截图和记录放在 `authoring/vue-refactor-checks/`。

模型测试仍为模拟响应，手机图片仍为浏览器尺寸模拟。没有用这些检查代替真实访谈、实地试用或付费验证。

### 开发参考

- [Vue单文件组件](https://cn.vuejs.org/guide/scaling-up/sfc.html)
- [Vue响应式基础](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vite入门](https://vite.dev/guide/)

## English

### Scope

This is an independent Vue edition copied from the original project. Original files are unchanged. Course reports are kept locally; reference materials remain in references/. Earlier Mini Program work provides historical context. Git metadata, actual `.env` files, installed dependencies and build caches were excluded from copying. Configure model credentials separately if needed.

The web version is now 0.4.0. Historical reports describe their original milestones; current behavior is documented here and in the READMEs.

### What changed

The original HTML plus manual DOM updates were replaced with real Vue 3 Single-File Components. `App.vue` composes six components for the header, setup, lesson, completion, rule lookup and source lists. Templates render reactive state, `v-model` binds form inputs, and component events send actions to the parent.

Shared styling remains in `src/styles.css`. Language, teaching/storage and cancellable requests are managed in `src/composables/`. The framework-independent game rules, state machine and server-side retrieval adapter are retained. Session data uses `shallowRef` to preserve immutable transitions and avoid passing Vue proxies into `structuredClone`.

### Running and editing

Install Node.js 22.12 or newer. Double-click `web/start-web.cmd`, or run `npm ci` and `npm start` from `web`. The launcher checks dependencies, builds `.vue` files with Vite, and starts the Node server. The browser receives compiled files from `dist/`; model credentials remain on the server.

Use `npm run dev` for hot updates while editing. Open the printed Vite URL, usually on port5173; API requests are forwarded to the local Node backend. `npm start` rebuilds before serving, so restart it after source changes.

Edit UI wording in `src/i18n.mjs`, layout in `src/App.vue` or `src/components/`, styling in `src/styles.css`, rule content in `src/game.mjs`, and transition behavior in `src/core.mjs`.

Folder fingerprints and versions distinguish the original and Vue services. Occupied ports trigger another port rather than reusing an unrelated instance. Browser progress is origin-specific; changing ports does not automatically transfer progress between versions.

### Validation

68 automated checks, 22 browser-flow checks and 6 launcher checks passed. Evidence is stored in `authoring/vue-refactor-checks/`. The launcher checks simulate an older service occupying a port, exercise actual production/development startup, and stop owned processes afterwards.

Model checks use controlled mocks, and mobile screenshots simulate viewport sizes. Live models, physical phones, WeChat browsing, real users and payments still need validation.

References: [Vue SFCs](https://vuejs.org/guide/scaling-up/sfc.html), [Vue reactivity](https://vuejs.org/guide/essentials/reactivity-fundamentals.html), [Vite guide](https://vite.dev/guide/).
