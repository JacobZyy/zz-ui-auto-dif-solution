import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { setCallbacks, startMcpBridge, stopMcpBridge } from '@/ui/services/mcp-bridge'

export interface BridgeState {
  connectionStatus: 'idle' | 'connected' | 'error'
  pollStatus: 'running' | 'stopped' | 'retrying'
  eventLog: Array<{ type: string, payload: unknown, timestamp: number }>
  isRunning: boolean
}

interface BridgeActions {
  startBridge: () => void
  stopBridge: () => void
  setConnectionStatus: (status: BridgeState['connectionStatus']) => void
  setPollStatus: (status: BridgeState['pollStatus']) => void
  appendLog: (entry: BridgeState['eventLog'][number]) => void
}

export const useBridgeStore = create(
  immer<BridgeState & BridgeActions>(set => ({
    connectionStatus: 'idle',
    pollStatus: 'stopped',
    eventLog: [],
    isRunning: false,
    startBridge: () => {
      set((state) => {
        state.isRunning = true
        state.pollStatus = 'running'
      })
      startMcpBridge()
    },
    stopBridge: () => {
      set((state) => {
        state.isRunning = false
        state.pollStatus = 'stopped'
      })
      stopMcpBridge()
    },
    setConnectionStatus: status => set((state) => { state.connectionStatus = status }),
    setPollStatus: status => set((state) => { state.pollStatus = status }),
    appendLog: entry => set((state) => {
      state.eventLog.push(entry)
      state.eventLog = state.eventLog.slice(-20)
    }),
  })),
)

// 初始化回调注册，service 事件通过回调同步到 store
setCallbacks({
  onConnectionStatusChange: status => useBridgeStore.getState().setConnectionStatus(status),
  onPollStatusChange: status => useBridgeStore.getState().setPollStatus(status),
  onEvent: (type, payload) => useBridgeStore.getState().appendLog({ type, payload, timestamp: Date.now() }),
})
