import type { IncomingMessage, ServerResponse } from 'node:http'
import type { NodeErrorResponse, NodeInfo, NodeQueryResponse } from './types.js'
import * as http from 'node:http'
import { pendingRequests } from './pending-requests.js'
import { selectionCache } from './selection-cache.js'

const PORT = 18765
const LONG_POLL_TIMEOUT_MS = 25_000

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function setCorsHeaders(res: ServerResponse): void {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value)
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => resolve(body))
  })
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  }
  catch {
    return undefined
  }
}

function isNodeOrError(val: unknown): val is NodeInfo | NodeErrorResponse {
  if (typeof val !== 'object' || val === null)
    return false
  const obj = val as Record<string, unknown>
  if (typeof obj.error === 'string' && typeof obj.nodeId === 'string')
    return true
  return typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.type === 'string'
}

function isNodeQueryResponse(val: unknown): val is NodeQueryResponse {
  if (typeof val !== 'object' || val === null)
    return false
  const obj = val as Record<string, unknown>
  return typeof obj.requestId === 'string' && isNodeOrError(obj.data)
}

interface SelectionBody {
  data: NodeInfo | null
  seq: number
}

function isSelectionBody(val: unknown): val is SelectionBody {
  if (typeof val !== 'object' || val === null)
    return false
  const obj = val as Record<string, unknown>
  return typeof obj.seq === 'number' && ('data' in obj)
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const url = req.url ?? '/'

  if (url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', pid: process.pid }))
    return
  }

  if (url === '/selection' && req.method === 'POST') {
    const raw = await readBody(req)
    const body = parseJson(raw)
    if (isSelectionBody(body)) {
      selectionCache.update(body.data, body.seq)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    }
    else {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'invalid body' }))
    }
    return
  }

  if (url === '/pending-requests' && req.method === 'GET') {
    const pending = pendingRequests.getPending()
    if (pending) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(pending))
      return
    }

    // Long-poll: hold for up to 25s
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        res.writeHead(204)
        res.end()
      }
    }, LONG_POLL_TIMEOUT_MS)

    // Poll every 200ms for new tasks
    const poll = setInterval(() => {
      if (resolved) {
        clearInterval(poll)
        return
      }
      const p = pendingRequests.getPending()
      if (p) {
        resolved = true
        clearInterval(poll)
        clearTimeout(timer)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(p))
      }
    }, 200)

    req.on('close', () => {
      if (!resolved) {
        resolved = true
        clearInterval(poll)
        clearTimeout(timer)
      }
    })
    return
  }

  if (url === '/node-result' && req.method === 'POST') {
    const raw = await readBody(req)
    const body = parseJson(raw)
    if (isNodeQueryResponse(body)) {
      pendingRequests.resolve(body.requestId, body.data)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    }
    else {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'invalid body' }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
}

function killStaleServer(): Promise<void> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/health`, (res) => {
      let body = ''
      res.on('data', (c: Buffer) => {
        body += c.toString()
      })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body) as { pid?: number }
          if (typeof parsed.pid === 'number' && parsed.pid !== process.pid) {
            console.error(`[ai-tools] Killing stale server process (pid=${parsed.pid})`)
            try {
              process.kill(parsed.pid, 'SIGTERM')
            }
            catch {
              /* already gone */
            }
          }
        }
        catch { /* ignore */ }
        // Give OS time to release the port
        setTimeout(resolve, 500)
      })
    })
    req.on('error', () => setTimeout(resolve, 200))
  })
}

function createHttpServer(resolve: () => void, reject: (err: Error) => void, retries = 2): void {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ai-tools] Request handler error:', msg)
      if (!res.headersSent) {
        res.writeHead(500)
        res.end()
      }
    })
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      killStaleServer().then(() => createHttpServer(resolve, reject, retries - 1))
    }
    else {
      reject(err)
    }
  })

  server.listen(PORT, () => {
    console.error(`[ai-tools] HTTP server listening on port ${PORT}`)
    resolve()
  })
}

export function startHttpServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    createHttpServer(resolve, reject)
  })
}
