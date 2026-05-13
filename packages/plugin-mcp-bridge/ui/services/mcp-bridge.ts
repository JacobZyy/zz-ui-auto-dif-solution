import { PluginMessage, UIMessage } from '@ui-differ/mastergo-shared/lib'

const MCP_BASE = 'http://localhost:18765'

/** 当前长轮询的 XHR 实例（用于 stopMcpBridge 时 abort） */
let pollXhr: XMLHttpRequest | null = null
let stopped = false
let backoffMs = 1000
let healthCheckTimer: ReturnType<typeof setInterval> | null = null

export interface BridgeCallbacks {
  onConnectionStatusChange: (status: 'idle' | 'connected' | 'error') => void
  onPollStatusChange: (status: 'running' | 'stopped' | 'retrying') => void
  onEvent: (type: string, payload: unknown) => void
}

let _callbacks: BridgeCallbacks | null = null

export function setCallbacks(callbacks: BridgeCallbacks): void {
  _callbacks = callbacks
}

function postJson(path: string, body: unknown): void {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', MCP_BASE + path, true)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.onerror = () => {
    console.warn(`[mcp-bridge] POST ${path} network error`)
    _callbacks?.onEvent('NETWORK_ERROR', { path, type: 'post' })
  }
  xhr.send(JSON.stringify(body))
}

interface PluginMessageEvent {
  type: PluginMessage
  data?: unknown
  seq?: number
}

interface NodeInfoPayload {
  requestId: string
  data: unknown
}

function isNodeInfoPayload(val: unknown): val is NodeInfoPayload {
  return (
    typeof val === 'object'
    && val !== null
    && typeof (val as Record<string, unknown>).requestId === 'string'
    && 'data' in (val as Record<string, unknown>)
  )
}

interface PendingTask {
  requestId: string
  nodeId: string
}

function isPendingTask(val: unknown): val is PendingTask {
  return (
    typeof val === 'object'
    && val !== null
    && typeof (val as Record<string, unknown>).requestId === 'string'
    && typeof (val as Record<string, unknown>).nodeId === 'string'
  )
}

/** UI iframe → sandbox：通过 parent.postMessage 发送 */
// MasterGo 插件架构中 UI iframe 与 sandbox 通过 postMessage 通信，
// host origin 由 MasterGo 运行时动态决定，无法提前硬编码，故使用 '*'
function sendToPlugin(type: UIMessage, data: unknown): void {
  parent.postMessage({ pluginMessage: { type, data } }, '*')
}

let selectionSeq = -1

function handlePluginMessage(event: MessageEvent): void {
  const msg = event.data as Record<string, unknown>
  // MasterGo 将消息包装为 { pluginMessage: { type, data, ... } }
  const pluginMsg = (msg.pluginMessage ?? msg) as PluginMessageEvent

  if (pluginMsg.type === PluginMessage.SELECTION_FOR_MCP) {
    const seq = typeof pluginMsg.seq === 'number' ? pluginMsg.seq : 0
    // 丢弃乱序消息
    if (seq <= selectionSeq)
      return
    selectionSeq = seq
    postJson('/selection', { data: pluginMsg.data ?? null, seq })
    _callbacks?.onEvent('SELECTION_FOR_MCP', { data: pluginMsg.data, seq })
    return
  }

  if (pluginMsg.type === PluginMessage.NODE_INFO) {
    const payload = pluginMsg.data
    if (!isNodeInfoPayload(payload))
      return
    postJson('/node-result', { requestId: payload.requestId, data: payload.data })
    _callbacks?.onEvent('NODE_INFO', payload)
  }
}

function checkHealth(): void {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', `${MCP_BASE}/health`, true)
  xhr.timeout = 5000
  xhr.onload = () => {
    if (xhr.status === 200) {
      _callbacks?.onConnectionStatusChange('connected')
    }
    else {
      _callbacks?.onConnectionStatusChange('error')
    }
  }
  xhr.onerror = () => {
    _callbacks?.onConnectionStatusChange('error')
  }
  xhr.ontimeout = () => {
    _callbacks?.onConnectionStatusChange('error')
  }
  xhr.send()
}

function doPoll(): void {
  if (stopped)
    return

  const xhr = new XMLHttpRequest()
  pollXhr = xhr
  xhr.open('GET', `${MCP_BASE}/pending-requests`, true)
  xhr.timeout = 30_000

  xhr.onload = () => {
    if (stopped)
      return
    backoffMs = 1000
    _callbacks?.onPollStatusChange('running')

    if (xhr.status === 204) {
      // 无待处理任务，立即重新轮询
      doPoll()
      return
    }

    if (xhr.status === 200) {
      try {
        const task: unknown = JSON.parse(xhr.responseText)
        if (isPendingTask(task)) {
          sendToPlugin(UIMessage.GET_NODE_INFO, {
            requestId: task.requestId,
            nodeId: task.nodeId,
          })
          _callbacks?.onEvent('PENDING_TASK', task)
        }
      }
      catch {
        // 忽略 JSON 解析错误
      }
      doPoll()
      return
    }

    // 非预期状态码：退避重试
    scheduleRetry()
  }

  xhr.onerror = () => {
    if (!stopped)
      scheduleRetry()
  }

  xhr.ontimeout = () => {
    if (!stopped)
      doPoll()
  }

  xhr.send()
}

function scheduleRetry(): void {
  if (stopped)
    return
  _callbacks?.onPollStatusChange('retrying')
  const delay = backoffMs
  backoffMs = Math.min(backoffMs * 2, 10_000)
  setTimeout(() => {
    if (!stopped)
      doPoll()
  }, delay)
}

/**
 * 启动 MCP 通信桥接服务
 * 监听 sandbox 消息并通过 XHR 与 MCP server 通信
 */
export function startMcpBridge(): void {
  stopped = false
  backoffMs = 1000
  selectionSeq = -1
  window.addEventListener('message', handlePluginMessage)
  doPoll()
  checkHealth()
  healthCheckTimer = setInterval(checkHealth, 10_000)
}

/**
 * 停止 MCP 通信桥接服务，中止当前轮询请求
 */
export function stopMcpBridge(): void {
  stopped = true
  window.removeEventListener('message', handlePluginMessage)
  if (pollXhr) {
    pollXhr.abort()
    pollXhr = null
  }
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer)
    healthCheckTimer = null
  }
}
