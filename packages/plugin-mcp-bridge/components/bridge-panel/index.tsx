import type { BridgeState } from '@/stores'
import {
  Badge,
  Button,
  Divider,
  List,
  Space,
  Tag,
  theme,
  Typography,
} from 'antd'
import { useEffect } from 'react'
import { useBridgeStore } from '@/stores'
import styles from './index.module.scss'

const { Text } = Typography

interface ConnectionInfo {
  status: 'default' | 'success' | 'error'
  text: string
}

interface PollInfo {
  color: 'processing' | 'default' | 'warning'
  text: string
}

const CONNECTION_MAP: Record<BridgeState['connectionStatus'], ConnectionInfo> = {
  idle: { status: 'default', text: '等待连接' },
  connected: { status: 'success', text: 'MCP 服务已连接' },
  error: { status: 'error', text: 'MCP 服务异常' },
}

const POLL_MAP: Record<BridgeState['pollStatus'], PollInfo> = {
  running: { color: 'processing', text: '运行中' },
  stopped: { color: 'default', text: '已停止' },
  retrying: { color: 'warning', text: '重试中' },
}

export function BridgePanel() {
  const { token } = theme.useToken()
  const {
    connectionStatus,
    pollStatus,
    eventLog,
    isRunning,
    startBridge,
    stopBridge,
  } = useBridgeStore()

  // Zustand action 引用稳定，可安全放入依赖数组
  useEffect(() => {
    startBridge()
    return () => {
      stopBridge()
    }
  }, [startBridge, stopBridge])

  const conn = CONNECTION_MAP[connectionStatus]
  const poll = POLL_MAP[pollStatus]

  return (
    <div
      className={styles.panel}
      style={{
        background: token.colorBgContainer,
        color: token.colorText,
        fontSize: token.fontSizeSM,
        padding: token.paddingSM,
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={token.paddingXS}>
        {/* 连接状态 */}
        <div className={styles.section}>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            连接状态
          </Text>
          <div style={{ marginTop: token.marginXXS }}>
            <Badge status={conn.status} text={conn.text} />
          </div>
        </div>

        <Divider style={{ margin: `${token.marginXXS}px 0` }} />

        {/* 轮询控制 */}
        <div className={styles.section}>
          <Space
            style={{ width: '100%', justifyContent: 'space-between' }}
            size={token.sizeXS}
          >
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              轮询服务
            </Text>
            <Button
              size="small"
              type={isRunning ? 'default' : 'primary'}
              onClick={isRunning ? stopBridge : startBridge}
            >
              {isRunning ? '停止' : '启动'}
            </Button>
          </Space>
          <div style={{ marginTop: token.marginXXS }}>
            <Tag
              color={poll.color}
              style={{ fontSize: token.fontSizeSM, margin: 0 }}
            >
              {poll.text}
            </Tag>
          </div>
        </div>

        <Divider style={{ margin: `${token.marginXXS}px 0` }} />

        {/* 事件日志 */}
        <div className={styles.section}>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            事件日志
          </Text>
          <List
            size="small"
            dataSource={eventLog.slice(-5)}
            renderItem={(log: BridgeState['eventLog'][number]) => (
              <List.Item
                style={{
                  padding: `${token.paddingXXS}px 0`,
                  borderBottom: 'none',
                }}
              >
                <Text
                  type="secondary"
                  style={{
                    fontSize: token.fontSizeSM,
                    fontFamily: token.fontFamilyCode,
                  }}
                >
                  [
                  {new Date(log.timestamp).toLocaleTimeString()}
                  ]
                  {' '}
                  {log.type}
                </Text>
              </List.Item>
            )}
            locale={{
              emptyText: (
                <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  暂无事件
                </Text>
              ),
            }}
          />
        </div>
      </Space>
    </div>
  )
}
