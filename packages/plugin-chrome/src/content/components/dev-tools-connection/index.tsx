import { Icon } from '@iconify/react'
import { FloatButton } from 'antd'
import { useDevToolsHeartbeat } from '@/content/hooks'

export default function DevToolsConnection() {
  const { connectionStatus } = useDevToolsHeartbeat()
  return (
    <>
      {connectionStatus === 'connected' && <FloatButton icon={<Icon icon="fluent:plug-connected-checkmark-20-filled" style={{ color: '#009f26' }} />} type="default" />}
      {connectionStatus === 'disconnected' && <FloatButton icon={<Icon icon="tabler:plug-connected" style={{ color: '#f71700' }} />} type="default" />}
    </>
  )
}
