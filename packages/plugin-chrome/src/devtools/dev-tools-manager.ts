import type { ChromeListenerMessageType } from '@/types/message'
import { ChromeMessageType, DevToolsNameEnum } from '@/types'
/**
 * DevTools 管理器单例
 * 负责管理 DevTools 与 Background 的连接和消息处理
 */
class DevToolsManager {
  private static instance: DevToolsManager
  private backgroundPort: chrome.runtime.Port | null = null
  private tabId: number | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private readonly RECONNECT_INTERVAL = 1000
  private readonly HEARTBEAT_INTERVAL = 15000

  public static getInstance(): DevToolsManager {
    if (!DevToolsManager.instance) {
      DevToolsManager.instance = new DevToolsManager()
    }
    return DevToolsManager.instance
  }

  /** 初始化连接 */
  public initialize(): void {
    this.tabId = chrome.devtools.inspectedWindow.tabId
    this.connectToBackground()
  }

  /** 连接到 Background */
  private connectToBackground(): void {
    try {
      this.backgroundPort = chrome.runtime.connect({ name: DevToolsNameEnum.UI_DIFF_PANEL })

      // 注册连接
      this.backgroundPort.postMessage({
        type: ChromeMessageType.PORT_REGISTER,
        data: this.tabId,
      })

      console.log('✅ DevTools 已连接到 Background, tabId:', this.tabId)
      this.reconnectAttempts = 0 // 重置重连次数

      // 启动定时心跳
      this.startHeartbeat()

      // 监听消息
      this.setupMessageListener()

      // 监听断开事件
      this.backgroundPort.onDisconnect.addListener(() => {
        console.warn('⚠️ DevTools 与 Background 的连接已断开')
        this.backgroundPort = null
        this.stopHeartbeat()
        this.handleReconnect()
      })
    }
    catch (error) {
      console.error('❌ 连接 Background 失败:', error)
      this.stopHeartbeat()
      this.handleReconnect()
    }
  }

  /** 启动心跳 */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.backgroundPort) {
        this.backgroundPort.postMessage({
          type: ChromeMessageType.HEARTBEAT,
          data: { tabId: this.tabId },
        })
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  /** 停止心跳 */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /** 处理重连逻辑 */
  private handleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(this.RECONNECT_INTERVAL * 2 ** this.reconnectAttempts, 10000)
      console.log(`🔄 尝试重连 Background... (${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})，延迟: ${delay}ms`)

      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++
        this.connectToBackground()
      }, delay)
    }
    else {
      console.error('❌ 已达到最大重连次数，停止重连')
    }
  }

  /** 设置消息监听器 */
  private setupMessageListener(): void {
    if (!this.backgroundPort)
      return

    this.backgroundPort.onMessage.addListener((message) => {
      const { type } = message as ChromeListenerMessageType

      // 处理获取元素请求
      if (type === ChromeMessageType.GET_ELEMENT_SELECTOR) {
        console.log('🚀 ~ [DevTools] DevToolsManager ~ 收到获取元素请求')
        this.handleGetSelectedElement()
      }
    })
  }

  /** 处理获取选中元素请求 */
  private handleGetSelectedElement(): void {
    console.log('🚀 ~ [DevTools] handleGetSelectedElement ~ 开始执行eval获取$0')
    const getSelectorExpression = `
      (function() {
        function getElementSelector(element) {
          if (!element) return null;
          if (element === document.documentElement) return 'html';
          if (element.id) return '#' + element.id;
          
          const path = [];
          let current = element;
          
          while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.nodeName.toLowerCase();
            
            if (current.className && typeof current.className === 'string') {
              const classes = current.className.trim().split(/\\s+/).filter(c => c);
              if (classes.length > 0) {
                selector += '.' + classes.join('.');
              }
            }
            
            if (current.parentNode) {
              const siblings = Array.from(current.parentNode.children).filter(
                sibling => sibling.nodeName === current.nodeName
              );
              if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += ':nth-of-type(' + index + ')';
              }
            }
            
            path.unshift(selector);
            current = current.parentNode;
            
            if (current && current.id) {
              path.unshift('#' + current.id);
              break;
            }
          }
          
          return path.join(' > ');
        }
        
        return getElementSelector($0);
      })()
    `

    chrome.devtools.inspectedWindow.eval(getSelectorExpression, (result, exceptionInfo) => {
      console.log('🚀 ~ [DevTools] handleGetSelectedElement ~ 发送结果到Background')
      this.sendMessage({
        type: ChromeMessageType.RETURN_ELEMENT_SELECTOR,
        data: {
          tabId: this.tabId,
          selector: result || null,
          error: exceptionInfo ? exceptionInfo.value : undefined,
        },
      })
    })
  }

  /** 发送消息到 Background */
  private sendMessage(message: ChromeListenerMessageType): void {
    if (!this.backgroundPort) {
      console.error('❌ Background 连接不存在，无法发送消息')
      return
    }

    try {
      this.backgroundPort.postMessage(message)
    }
    catch (error) {
      console.error('❌ devtools发送消息失败:', error)
    }
  }

  /** 获取连接状态 */
  public isConnected(): boolean {
    return this.backgroundPort !== null
  }

  /** 获取当前 tabId */
  public getTabId(): number | null {
    return this.tabId
  }
}

export const devToolsManager = DevToolsManager.getInstance()
