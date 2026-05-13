# @zz-mcp/ui-diff-mcp

AI 驱动的 MasterGo 设计稿节点查询 MCP 服务。将 MasterGo 插件中的节点数据通过 MCP protocol 暴露给 Claude Code 等 AI 工具。

## 功能

- **实时选中快照**：MasterGo 中选中任意节点，AI 可立即获取其属性
- **按需节点查询**：通过 nodeId 精确查询任意节点的详细信息
- **双通道通信**：MCP stdio 通道 + HTTP 本地服务（port 18765）

## 可用函数

### `get_selected_node`

获取 MasterGo 当前选中节点的属性快照。无需等待，直接返回缓存数据。

**参数**：无

**返回值示例**：

```json
{
  "selected": {
    "id": "11:809",
    "name": "容器 1117",
    "type": "FRAME",
    "x": 488,
    "y": 24,
    "width": 236,
    "height": 232,
    "fills": [{ "type": "SOLID", "color": { "r": 0.91, "g": 0.79, "b": 0.79, "a": 1 } }],
    "opacity": 1,
    "childrenIds": ["11:0010", "11:0019", "11:0028", "11:0037"]
  },
  "freshAt": 1778263424580
}
```

### `get_node_by_id`

按 nodeId 精确查询 MasterGo 节点属性。同步阻塞等待插件响应，超时 25 秒。

**参数**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nodeId | string | 是 | MasterGo 节点 ID |

**返回值**：节点属性 JSON，包含 id、name、type、x、y、width、height、opacity、fills、fontSize、characters、fontName 等字段

## MCP 配置

### Claude Code

在 `.claude/settings.json` 中添加：

```json
{
  "mcpServers": {
    "ui-diff-mcp": {
      "command": "npx",
      "args": ["-y", "@zz-mcp/ui-diff-mcp"]
    }
  }
}
```

重启 Claude Code 后，在对话中执行 `/mcp` 确认状态为 `connected`。

### 本地开发（源码运行）

```bash
# 进入包目录
cd packages/ui-diff-mcp

# 源码运行（需 tsx）
pnpm mcp:server

# 或构建后运行
pnpm build
node dist/index.js
```

## 架构

```
Claude Code (MCP Client)
    |
    | stdio protocol
    v
MCP Server (@zz-mcp/ui-diff-mcp)
    |
    | HTTP localhost:18765
    v
UI iframe (mcp-bridge.ts)
    |
    | postMessage
    v
MasterGo Sandbox (lib/main.ts)
    |
    v
MasterGo Plugin API (mg.*)
```

## 配套插件

本 MCP 服务需要配合 MasterGo 插件使用。插件负责：

- 监听选择变化，推送节点快照
- 响应 `GET_NODE_INFO` 消息，查询指定节点

插件发布地址：MasterGo 插件广场（待补充）

## 环境要求

- Node.js >= 18.0.0

## 版本

当前版本：1.0.0
