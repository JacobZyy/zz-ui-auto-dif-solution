import type { SwitchProps } from 'antd'
import { Switch } from 'antd'
import { enableMapSet } from 'immer'
import { useState } from 'react'
import './App.css'

enableMapSet()

export default function App() {
  const [contentScriptVisible, setContentScriptVisible] = useState(true)
  const handleChangeContentScriptVisible: SwitchProps['onChange'] = (checked) => {
    setContentScriptVisible(checked)
    chrome.runtime.sendMessage({
      type: 'SET_CONTENT_SCRIPT_VISIBLE',
      data: checked,
    })
  }
  return (
    <div style={{ padding: '16px' }}>
      页面插件开关:
      <Switch checked={contentScriptVisible} onChange={handleChangeContentScriptVisible} />
    </div>
  )
}
