import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'
import { pendingRequests } from './pending-requests.js'
import { selectionCache } from './selection-cache.js'

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    { name: 'ui-differ-ai-tools', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_selected_node',
        description: '获取 MasterGo 当前选中节点的属性（快照语义，无需 round-trip）',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_node_by_id',
        description: '按 nodeId 从 MasterGo 插件查询节点属性（同步阻塞，等待插件响应）',
        inputSchema: {
          type: 'object',
          properties: {
            nodeId: {
              type: 'string',
              description: 'MasterGo 节点 ID',
            },
          },
          required: ['nodeId'],
        },
      },
    ],
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    if (name === 'get_selected_node') {
      const snapshot = selectionCache.get()
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(snapshot, null, 2),
          },
        ],
      }
    }

    if (name === 'get_node_by_id') {
      if (!args || typeof (args as Record<string, unknown>).nodeId !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'nodeId is required and must be a string')
      }
      const nodeId = (args as Record<string, unknown>).nodeId as string

      try {
        const result = await pendingRequests.create(nodeId)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }
      catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new McpError(ErrorCode.InternalError, msg)
      }
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[ai-tools] MCP server connected via stdio')
}
