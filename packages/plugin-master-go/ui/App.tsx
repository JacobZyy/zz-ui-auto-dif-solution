import type { NodeInfo, RootNodeOffsetInfo, UniqueId } from '@ui-differ/core'
import type { PluginMessageType } from '@ui-differ/mastergo-shared/lib'
import type { RadioGroupProps } from 'antd'
import {
  combineMaskLayers,
  combineSliceLayers,
  DESIGN_NODE_PREFIX,
  designConfigs,
  getRootBoundingOffset,
  hoistingRectangleStyle,
  processDesignNodeChain,
  processOverFlowHidden,
  SafeTopAreaType,
  safeTopAreaTypeMap,
  safeTopAreaTypeOptions,
  unifiedLineHeightValue,
} from '@ui-differ/core'
import { PluginMessage, sendUIMsgToPlugin, UIMessage } from '@ui-differ/mastergo-shared/lib'
import { SelectionDisplay } from '@ui-differ/mastergo-shared/ui'
import { useMemoizedFn } from 'ahooks'
import { Button, Card, Flex, message, Radio, Space, Typography } from 'antd'
import ClipboardJS from 'clipboard'
import { useEffect, useRef, useState } from 'react'
import ReactJson from 'react-json-view'
import { drawCurrentNodeInfos, processDesignExtraInfo } from './utils'
import './App.css'

function App() {
  const [selectedNode, setSelectedNode] = useState<Record<UniqueId, NodeInfo>>({})
  const [originNodeData, setOriginNodeData] = useState<SceneNode>()
  const [documentInfo, setDocumentInfo] = useState<Partial<{ document: DocumentNode, currentPage: PageNode }>>()
  const [rootDesignNodeInfo, setRootDesignNodeInfo] = useState<{ id: string, name: string }>({ id: '', name: '' })

  const [safeTopAreaType, setSafeTopAreaType] = useState<SafeTopAreaType>(SafeTopAreaType.STATUS_BANNER)

  const rootOffset = useRef<RootNodeOffsetInfo>({
    x: 0,
    y: 0,
    height: 0,
    id: '',
  })

  /** 获取转换成px信息后的设计稿信息（用于复制） */
  const handleGetConvertedNodeData = async (rootNode: SceneNode) => {
    const currentSafeAreaConfig = safeTopAreaTypeMap.get(safeTopAreaType)!
    try {
      designConfigs.setConvertPxTrigger(true)
      designConfigs.setSafeTopHeight(currentSafeAreaConfig?.safeTopHeight)
      designConfigs.setSafeBottomHeight(currentSafeAreaConfig?.safeBottomHeight)
      rootOffset.current = getRootBoundingOffset(rootNode)
      const flatNodeMap = await processDesignNodeChain(rootNode, rootOffset.current)
      setSelectedNode(Object.fromEntries(flatNodeMap.entries()))
    }
    finally {
      designConfigs.setConvertPxTrigger(false)
    }
  }

  /** 获取转换成px信息后的设计稿信息（用于测试绘制） */
  const handleGetNodeConvertedNodeData = async (rootNode: SceneNode) => {
    const prevValue = {
      safeTopHeight: designConfigs.getSafeTopHeight(),
      safeBottomHeight: designConfigs.getSafeBottomHeight(),
      convertPxTrigger: designConfigs.getConvertPxTrigger(),
    }

    try {
      designConfigs.setConvertPxTrigger(false)
      designConfigs.setSafeTopHeight(0)
      designConfigs.setSafeBottomHeight(0)

      rootOffset.current = getRootBoundingOffset(rootNode)
      const flatNodeMap = await processDesignNodeChain(rootNode, rootOffset.current)
      return flatNodeMap
    }
    finally {
      designConfigs.setConvertPxTrigger(prevValue.convertPxTrigger)
      designConfigs.setSafeTopHeight(prevValue.safeTopHeight)
      designConfigs.setSafeBottomHeight(prevValue.safeBottomHeight)
    }
  }

  const handlePreProcessNodeData = (rootNode: SceneNode) => {
    const combinedNode = combineMaskLayers(rootNode)
    // 这里实际是一步偷懒行为
    const combinedSliceNode = combineSliceLayers(combinedNode)
    const unifiedLineHeightNode = unifiedLineHeightValue(combinedSliceNode)
    const hoistedNode = hoistingRectangleStyle(unifiedLineHeightNode)
    const overFlowHiddenNode = processOverFlowHidden(hoistedNode)
    return overFlowHiddenNode
  }

  // 监听来自插件的消息
  const messageHandler = useMemoizedFn(async (event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type === PluginMessage.SELECTION_CHANGE) {
      if (!data?.length) {
        setOriginNodeData(undefined)
        setSelectedNode({})
        return
      }
      try {
        const processOriginData: any = handlePreProcessNodeData(data[0])
        setOriginNodeData(processOriginData)
        handleGetConvertedNodeData(processOriginData)
        /** 拿当前节点的设计稿节点信息 */
        sendUIMsgToPlugin({
          type: UIMessage.GET_DOCUMENT_INFO,
          data: processOriginData.id,
        })
      }
      catch (error) {
        console.error(error)
      }
    }
    if (type === PluginMessage.DOCUMENT_INFO) {
      setDocumentInfo(data)
    }
    if (type === PluginMessage.TOP_PARENT_NODE) {
      if (!data) {
        return
      }
      setRootDesignNodeInfo({
        id: data.id || '',
        name: data.name || '',
      })
    }
  })

  const getInitialSelectionNode = useMemoizedFn(() => {
    sendUIMsgToPlugin({
      type: UIMessage.GET_DOCUMENT_INFO,
      data: null,
    })
    sendUIMsgToPlugin({
      type: UIMessage.GET_SELECTION,
      data: null,
    })
  })

  const handleInitClipboard = () => {
    const clipboard = new ClipboardJS('.copy-btn')
    clipboard.on('success', () => {
      message.success('复制成功')
    })
    clipboard.on('error', (e) => {
      console.error(e)
      message.error('复制失败')
    })
  }

  useEffect(() => {
    getInitialSelectionNode()
    handleInitClipboard()
    window.addEventListener('message', messageHandler)
    return () => window.removeEventListener('message', messageHandler)
  }, [])

  /** 切换顶部排除类型 */
  const handleChangeSafeTopAreaType: RadioGroupProps['onChange'] = (e) => {
    setSafeTopAreaType(e.target.value)
    // 刷新数据
    sendUIMsgToPlugin({
      type: UIMessage.GET_SELECTION,
      data: null,
    })
  }

  /** 绘制节点 */
  const handleDrawNodeInfos = async () => {
    if (!originNodeData) {
      return
    }
    const nodeDataForDraw = await handleGetNodeConvertedNodeData(originNodeData)
    drawCurrentNodeInfos(nodeDataForDraw, rootOffset.current)
  }

  /** 测试用, 背景rectangle样式提升测试 */
  const handleBackgroundRectangleTest = async () => {
    if (!originNodeData)
      return
    const updatedNode = hoistingRectangleStyle(originNodeData)
    setOriginNodeData(updatedNode)
  }

  const copyText = `${DESIGN_NODE_PREFIX}${JSON.stringify({
    designExtraInfo: processDesignExtraInfo({ currentNode: originNodeData, rootDesignNodeInfo, ...documentInfo }),
    designNodeList: Object.values(selectedNode),
  }, null, 2)}`

  return (
    <div className="app">
      <Space orientation="vertical" size="middle">
        <Flex gap="md" vertical wrap>
          <Typography.Text strong>顶部排除类型</Typography.Text>
          <Radio.Group value={safeTopAreaType} onChange={handleChangeSafeTopAreaType} options={safeTopAreaTypeOptions} />
        </Flex>
        <Flex gap={4} wrap>
          <Button variant="filled" color="geekblue" className="copy-btn" data-clipboard-text={copyText}>
            复制节点信息
          </Button>
          {__DEV__ && (
            <>
              <Button variant="filled" color="blue" onClick={handleDrawNodeInfos}>
                绘制节点
              </Button>
              <Button variant="filled" color="blue" onClick={handleBackgroundRectangleTest}>
                背景rectangle样式提升测试
              </Button>
            </>
          )}
        </Flex>
        <ReactJson src={originNodeData || {}} />
        <Card
          title="当前选中"
          styles={{
            header: { background: '#121b38', color: '#fff' },
            body: { background: '#121b38' },
          }}
        >
          <Flex vertical align="center" justify="center">
            <SelectionDisplay />
          </Flex>
        </Card>
      </Space>
    </div>
  )
}

export default App
