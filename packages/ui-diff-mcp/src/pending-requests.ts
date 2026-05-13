import type { NodeErrorResponse, NodeInfo, PendingRequest } from './types.js'
import { v4 as uuidv4 } from 'uuid'

const PENDING_TTL_MS = 30_000

class PendingRequestManager {
  private readonly pending = new Map<string, PendingRequest>()
  // FIFO queue of requestIds
  private readonly queue: string[] = []

  create(nodeId: string): Promise<NodeInfo | NodeErrorResponse> {
    return new Promise<NodeInfo | NodeErrorResponse>((resolve, reject) => {
      const requestId = uuidv4()
      const timeoutHandle = setTimeout(() => {
        this.reject(requestId, new Error('Timeout: plugin did not respond within 30s'))
      }, PENDING_TTL_MS)

      this.pending.set(requestId, { requestId, nodeId, resolve, reject, timeoutHandle })
      this.queue.push(requestId)
    })
  }

  resolve(requestId: string, data: NodeInfo | NodeErrorResponse): void {
    const req = this.pending.get(requestId)
    if (!req)
      return
    clearTimeout(req.timeoutHandle)
    this.pending.delete(requestId)
    this.removeFromQueue(requestId)
    req.resolve(data)
  }

  reject(requestId: string, reason: Error): void {
    const req = this.pending.get(requestId)
    if (!req)
      return
    clearTimeout(req.timeoutHandle)
    this.pending.delete(requestId)
    this.removeFromQueue(requestId)
    req.reject(reason)
  }

  /** 返回最早一条挂起请求（FIFO），供长轮询使用 */
  getPending(): { requestId: string, nodeId: string } | undefined {
    const id = this.queue[0]
    if (!id)
      return undefined
    const req = this.pending.get(id)
    if (!req)
      return undefined
    return { requestId: req.requestId, nodeId: req.nodeId }
  }

  private removeFromQueue(requestId: string): void {
    const idx = this.queue.indexOf(requestId)
    if (idx !== -1)
      this.queue.splice(idx, 1)
  }
}

export const pendingRequests = new PendingRequestManager()
