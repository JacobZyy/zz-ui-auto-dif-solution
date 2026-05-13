import type { CSSProperties } from 'react'
import type { PluginMessageType } from '../../lib/message/sender'
import { convertToBase64 } from '@ui-differ/connection-tools'
import { useMemoizedFn } from 'ahooks'
import { useEffect, useState } from 'react'
import { sendUIMsgToPlugin } from '../../lib/message/sender'
import { PluginMessage, UIMessage } from '../../lib/message/type'

interface SelectionDisplayProps {
  className?: string
}

export function SelectionDisplay({ className }: SelectionDisplayProps) {
  const [imgBase64, setImageBase64] = useState<string>()
  const [selectionSize, setSelectionSize] = useState<Pick<CSSProperties, 'width' | 'height' | 'background'>>({ width: 0, height: 0, background: '#fff' })

  const displayMsgProcessor = useMemoizedFn(async (event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type !== PluginMessage.PREVIEW_IMAGE)
      return
    if (!data) {
      setImageBase64(undefined)
      setSelectionSize({ width: 0, height: 0, background: '#fff' })
      return
    }
    const { imgUnit8Array, selectionWidth, selectionHeight } = data || {}
    if (typeof imgUnit8Array === 'string') {
      setImageBase64(imgUnit8Array)
    }
    const fileBuffer = new Uint8Array(imgUnit8Array)
    const fileBase64 = await convertToBase64(fileBuffer)
    setImageBase64(fileBase64)
    setSelectionSize({
      width: `${selectionWidth / 2}px`,
      height: `${selectionHeight / 2}px`,
      background: '#fff',
    })
  })

  useEffect(() => {
    sendUIMsgToPlugin({
      type: UIMessage.GET_PREVIEW_IMAGE,
      data: null,
    })
    window.addEventListener('message', displayMsgProcessor)
    return () => window.removeEventListener('message', displayMsgProcessor)
  }, [])
  return (
    !!imgBase64 && <img src={imgBase64} style={selectionSize} className={className} />
  )
}
