import type { NodeInfo, SelectionSnapshot } from './types.js'

class SelectionCacheManager {
  private snapshot: SelectionSnapshot = { selected: null, reason: 'no_plugin_connected' }
  private lastSeq = -1

  update(data: NodeInfo | null, seq: number): void {
    if (seq <= this.lastSeq)
      return
    this.lastSeq = seq
    if (data === null) {
      this.snapshot = { selected: null, reason: 'no_selection', freshAt: Date.now() }
    }
    else {
      this.snapshot = { selected: data, freshAt: Date.now() }
    }
  }

  get(): SelectionSnapshot {
    return this.snapshot
  }
}

export const selectionCache = new SelectionCacheManager()
