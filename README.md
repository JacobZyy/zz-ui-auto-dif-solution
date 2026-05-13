# ui-differ-monorepo

> 转转「UI 自动化走查」生态的 monorepo —— 一套核心算法、一套对接工具，驱动 Chrome、MasterGo 多端宿主与 AI 工具。

<!-- TODO(项目方): 此处补充 1-2 段产品背景：设计目标、解决的痛点、上下游协作角色（设计 / RD / QA）。-->

---

## 仓库定位

- **monorepo**：`pnpm workspace`，工作区匹配 `packages/*`
- **分层**：核心算法 → 集成工具 → 共享层 → 三端宿主 + AI 通路
- **不在 host 内复刻算法**：宿主只做事件桥接、消息流转与 UI 壳，所有比对/匹配逻辑都收敛到 `@ui-differ/core`

宿主只是 IO 层，pipeline 才是单一事实源——任何走查策略变化都从 core 出发，所有 host 同步收益。

## 目录结构

```text
ui_diff_plugins/
├── packages/
│   ├── ui-differ-core/          # @ui-differ/core            核心算法
│   ├── connection-tools/        # @ui-differ/connection-tools 上传 / 鉴权 / 上报
│   ├── mastergo-shared/         # @ui-differ/mastergo-shared  MasterGo 共享 lib + ui
│   ├── plugin-master-go/        # @ui-differ/plugin-master-go MasterGo 主走查插件
│   ├── plugin-mcp-bridge/       # @ui-differ/plugin-mcp-bridge MasterGo ⇄ MCP 桥
│   ├── ui-detect-plugin/        # @ui-differ/ui-detect-plugin  MasterGo 预处理检测
│   ├── plugin-chrome/           # @ui-differ/plugin-chrome     Chrome 走查扩展
│   ├── ui-diff-mcp/             # @zz-mcp/ui-diff-mcp          MCP Server
│   ├── slidev-ui-diff-share/    # 部门分享 deck (Slidev)
│   └── dist/                    # 统一构建产物出口 (由 scripts 产生)
├── scripts/                     # build-sequential / dev-sequential / packages-config
├── doc/                         # 仓库架构与历史文档
├── openspec/                    # OpenSpec 规格文档
├── development/                 # 开发辅助文件
├── AGENTS.md                    # Agent 协作守则
├── CLAUDE.md                    # 转转前端规范入口
├── pnpm-workspace.yaml
└── package.json
```

## 架构总览

```text
              ┌──────────────────────────────────────────────────────────┐
              │                       Hosts (业务端)                       │
              │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │
              │ │ plugin-chrome  │ │plugin-master-go│ │ui-detect-plugin│ │
              │ │  Chrome MV3    │ │   MasterGo     │ │   MasterGo     │ │
              │ └────────┬───────┘ └────────┬───────┘ └────────┬───────┘ │
              │          │                  │                  │         │
              │          │     ┌────────────┴──────────────┐   │         │
              │          │     │     mastergo-shared       │   │         │
              │          │     │       lib + ui            │   │         │
              │          │     └────────────┬──────────────┘   │         │
              │          ▼                  ▼                  ▼         │
              │   ┌──────────────────────────────────────────────────┐   │
              │   │             @ui-differ/core                       │   │
              │   │   normalize · match · diff · stores · types       │   │
              │   └──────────────────────────────────────────────────┘   │
              │   ┌──────────────────────────────────────────────────┐   │
              │   │        @ui-differ/connection-tools                │   │
              │   │   auth · upload · image · lark · big-file         │   │
              │   └──────────────────────────────────────────────────┘   │
              └──────────────────────────────────────────────────────────┘

       ┌────────────── AI 通路 ──────────────┐     ┌── 内部分享 ───┐
       │ plugin-mcp-bridge (MasterGo plugin) │     │ slidev share  │
       │             ⇅ HTTP :18765           │     └───────────────┘
       │ @zz-mcp/ui-diff-mcp (Node stdio)    │
       │             ⇅ MCP protocol          │
       │ Claude Code / Cursor / 其他 IDE       │
       └─────────────────────────────────────┘
```

## 包速览

| 包 | 类型 | 职责 | 主要依赖 |
|---|---|---|---|
| `@ui-differ/core` | 算法库（library，ESM + dts） | UI 差异分析核心：`common-handlers` / `design-handlers` / `dom-handlers` / `design-pre-process` / `stores` / `types` / `utils` | — |
| `@ui-differ/connection-tools` | 集成库（library） | `auth` / `big-file-handlers` / `image-handlers` / `lark-handlers`，对接上传、登录、飞书上报 | — |
| `@ui-differ/mastergo-shared` | 共享 SDK（双入口 `./lib` / `./ui`） | `lib`: handlers、message sender/type、selection-display；`ui`: React 组件 | core, connection-tools |
| `@ui-differ/plugin-master-go` | MasterGo 插件 `zz-ui-differ` (id `179324813369599`) | 主走查插件，`editor_type: canvas + devMode`，`capabilities: inspect` | shared, core, connection-tools, clipboard, react-json-view |
| `@ui-differ/plugin-mcp-bridge` | MasterGo 插件 `ui-diff-mcp-bridge` (id `192929730745598`) | 把 MasterGo 节点选择/查询桥到本地 HTTP，供 MCP 转发给 AI | shared, zustand |
| `@ui-differ/ui-detect-plugin` | MasterGo 插件「转转UI检测工具」(id `181671972997071`) | 设计稿预处理多步骤检测，`pages`: `home` / `detect-page` / `result-page` | shared, core, connection-tools, zustand |
| `@ui-differ/plugin-chrome` | Chrome MV3 扩展 | `background` / `content` / `devtools` / `popup` / `sidepanel` / `css-hacker`，匹配 `*.zhuanzhuan.com`、`localhost`、`fe.zhuanspirit.com` | core, connection-tools, cookies-next, zustand, sass |
| `@zz-mcp/ui-diff-mcp` | MCP Server（Node CLI） | 暴露 `get_selected_node` / `get_node_by_id`，stdio MCP + localhost:18765 双通道 | `@modelcontextprotocol/sdk` |
| `slidev-ui-diff-share` | Slidev 演示 deck | 部门分享材料，deck 标题默认「转转自动化ui走查工具分享」 | — |

> 仅 `@ui-differ/core` / `@ui-differ/connection-tools` / `@ui-differ/mastergo-shared` / `@zz-mcp/ui-diff-mcp` 为发布产物；host 包均私有打包，输出到根级 `dist/`。

## 环境要求

- **Node.js** `>= 18.0.0`（`ui-diff-mcp` 强制 18+；其他 host 兼容 16+，统一以 18 为基线）
- **pnpm** `>= 8.0.0`
- 私有源：`https://rcnpm.zhuanspirit.com`

```bash
pnpm config set registry https://rcnpm.zhuanspirit.com
pnpm install
```

## 常用脚本

仓库根目录 `package.json` 已对常用流程做了一层聚合：

| 命令 | 说明 |
|---|---|
| `pnpm dev` | `tsx scripts/dev-sequential.ts`，按依赖拓扑顺序启动各包 watch |
| `pnpm dev:parallel` | 直接 `pnpm -r --parallel dev`，并行启动所有包 |
| `pnpm dev:core` | 只 watch `@ui-differ/core` |
| `pnpm dev:connection-tools` | 只 watch `@ui-differ/connection-tools` |
| `pnpm dev:chrome` | 启动 `plugin-chrome` 开发构建 |
| `pnpm dev:mastergo` | 启动 `plugin-master-go` 双线程 watch |
| `pnpm dev:mcp` | 通过 `tsx` 运行 MCP Server（⚠️ 根脚本 filter 别名 `@ui-differ/ai-tools` 已过期，实际包名为 `@zz-mcp/ui-diff-mcp`，建议直接用 `pnpm --filter @zz-mcp/ui-diff-mcp mcp:server`） |
| `pnpm build` | `tsx scripts/build-sequential.ts`，按拓扑顺序构建 |
| `pnpm build:parallel` | `pnpm -r build`，并行构建 |
| `pnpm build:core` | 仅构建 core |
| `pnpm clean` | 各包 `clean`：清理 `dist/` |
| `pnpm clean:modules` | 各包 `clean:modules` + 删除根 `node_modules` |

> MasterGo 插件每个都拆成 `dev:ui` + `dev:main` 两条 watch 流，分别构建 iframe UI 与 main 沙箱产物，最终一并打到 `packages/<plugin>/build/`。

## 各 host 加载方式

### Chrome 扩展 (`plugin-chrome`)

```bash
pnpm dev:chrome              # 开发构建
pnpm --filter @ui-differ/plugin-chrome build  # 生产构建
```

1. 打开 `chrome://extensions/`
2. 开启 **开发者模式**
3. **加载已解压的扩展程序** → 选择 `packages/plugin-chrome/dist/` 或 `dist/plugin-chrome/`

manifest 由 `manifest.config.ts` 通过 `@crxjs/vite-plugin` 动态生成，dev 环境插件名带 `-dev` 后缀。

### MasterGo 插件 (`plugin-master-go` / `plugin-mcp-bridge` / `ui-detect-plugin`)

```bash
pnpm dev:mastergo            # 走查主插件
pnpm --filter @ui-differ/plugin-mcp-bridge dev   # MCP 桥
pnpm --filter @ui-differ/ui-detect-plugin dev    # 预处理检测
```

在 MasterGo 中：**开发者 → 导入本地插件 → 选择对应包目录的 `manifest.json`**。

### MCP Server (`@zz-mcp/ui-diff-mcp`)

源码运行：

```bash
# 根脚本中的 filter 别名 @ui-differ/ai-tools 已过期，建议直接使用真实包名
pnpm --filter @zz-mcp/ui-diff-mcp mcp:server
```

构建后通过 `npx` 接入 Claude Code：

```jsonc
{
  "mcpServers": {
    "ui-diff-mcp": {
      "command": "npx",
      "args": ["-y", "@zz-mcp/ui-diff-mcp"]
    }
  }
}
```

工作流程：MasterGo 中安装 `plugin-mcp-bridge` → 它向 localhost:18765 推送选中/响应 → MCP Server 通过 stdio 把 `get_selected_node` / `get_node_by_id` 暴露给 AI。

## AI 通路（MCP）调用示例

`get_selected_node`（无参，读取插件实时快照）：

```json
{
  "selected": {
    "id": "11:809",
    "name": "容器 1117",
    "type": "FRAME",
    "x": 488, "y": 24, "width": 236, "height": 232,
    "opacity": 1,
    "childrenIds": ["11:0010", "11:0019", "11:0028", "11:0037"]
  },
  "freshAt": 1778263424580
}
```

`get_node_by_id`（同步阻塞，超时 25s）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `nodeId` | `string` | MasterGo 节点 ID |

## 开发约定

- **语言**：TypeScript 严格模式，禁止使用 `any`，详见 [`.claude/rules/language-typescript.md`](.claude/rules/language-typescript.md)
- **代码质量**：圈复杂度 ≤ 15、单文件 ≤ 1000 行、注释密度 ≥ 3%，详见 [`.claude/rules/fe-quality.md`](.claude/rules/fe-quality.md)
- **提交规范**：`<type>[scope]: <中文描述>`，详见 [`.claude/rules/git-commit.md`](.claude/rules/git-commit.md)
- **包管理**：统一 pnpm，依赖版本以 `package.json` 为准，禁手填版本号
- **复用优先**：扩展现有 pipeline、handlers、stores、message 协议，避免新增并行抽象
- **边界收敛**：浏览器 / MasterGo 主沙箱 / iframe 的弱类型 message payload 不得渗透进 core

更详细的协作流程见 [`AGENTS.md`](./AGENTS.md) 与 [`doc/repo-architecture.md`](./doc/repo-architecture.md)。

## 验证清单

每次改动至少覆盖直接文件，并按 host 检查上下游：

- **改 `ui-differ-core`** → 保持阶段化 pipeline，在 host 中真实跑一遍走查链路
- **改 `plugin-chrome`** → 检查 `manifest`、`background` / `content` / `devtools` / `popup` / `sidepanel` 联通性
- **改 MasterGo 插件** → 同时验证 `lib/`（main 沙箱）与 `ui/`（iframe）的 message 契约
- **改上报/上传** → 顺手检查 `connection-tools` 的 image / big-file / lark handlers

## License

ISC
