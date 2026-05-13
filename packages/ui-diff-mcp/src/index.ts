import { startHttpServer } from './http-server.js'
import { startMcpServer } from './mcp-server.js'

async function main(): Promise<void> {
  // Start HTTP server first (plugin UI communicates via HTTP)
  await startHttpServer()
  // Then start MCP server (blocks process via stdio transport)
  await startMcpServer()
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('[ai-tools] Fatal error:', msg)
  process.exit(1)
})
