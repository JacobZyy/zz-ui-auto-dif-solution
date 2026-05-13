/**
 * DevTools 连接管理器
 * 简化版本：只管理连接和心跳记录，不自动发送心跳
 */
class DevtoolsConnectionManager {
  private static instance: DevtoolsConnectionManager

  private connections: Map<number, chrome.runtime.Port>

  private constructor() {
    this.connections = new Map()
  }

  public static getInstance(): DevtoolsConnectionManager {
    if (!DevtoolsConnectionManager.instance) {
      DevtoolsConnectionManager.instance = new DevtoolsConnectionManager()
    }
    return DevtoolsConnectionManager.instance
  }

  public getPort(tabId: number | undefined): chrome.runtime.Port | undefined {
    if (typeof tabId !== 'number') {
      return undefined
    }
    return this.connections.get(tabId)
  }

  public register(tabId: number, port: chrome.runtime.Port): void {
    this.connections.set(tabId, port)
    console.log(`✅ DevTools 已注册, tabId: ${tabId}`)
  }

  public removeByPort(port: chrome.runtime.Port): void {
    for (const [tabId, p] of this.connections.entries()) {
      if (p === port) {
        this.connections.delete(tabId)
        console.log(`⚠️ DevTools 已移除, tabId: ${tabId}`)
        break
      }
    }
  }

  /** 获取所有连接的 tabId 列表 */
  public getAllConnectedTabs(): number[] {
    return Array.from(this.connections.keys())
  }
}

export const devtoolsConnectionManager = DevtoolsConnectionManager.getInstance()
