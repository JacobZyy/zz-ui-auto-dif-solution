import type { UIDiffBaseInfo, UIDiffFieldType } from '@ui-differ/connection-tools'
import type { NodeInfo, UniqueId } from '@ui-differ/core'
import type { ButtonProps, GetProp } from 'antd'
import chalk from '@alita/chalk'
import { Icon } from '@iconify/react'
import { addLarkRecord, getLarkRecordList } from '@ui-differ/connection-tools'
import {
  clearDomTree,
  convertSingleBorderToDivider,
  DEFAULT_PAGE_HEIGHT,
  DEFAULT_PAGE_WIDTH,
  DESIGN_NODE_PREFIX,
  detectListNodes,
  domConfigs,
  getDomNodeByUniqueId,
  getHasTextAutoResize,
  getNeighborNodeDistance,
  hoistingNotBfcBoundaryMargin,
  initialDomUUID,
  markIsSizeFromStyleSheet,
  markUnvisibleNodes,
  onDomInfoRecorder,
  preProcessZZUITag,
  processDomInlineStyle,
  processDomNodeShouldShrinkBounding,
  processDomZZUINode,
  processLargeLineHeight,
  processMarginCollapsing,
  processMultiLineTextWidth,
  processPaddingInfo,
  processPriceContainer,
  recordHybridNodeMatchResult,
  removeSameSizePositionChildren,
  searchNeighborNodes,
  searchNeighborNodesInitial,
  shrinkRectBounding,
  sleep,
  syncTextInfoToTextParentNode,
  uiDiff,
  wrapperTextNodeWithSpan,
} from '@ui-differ/core'
import { useMemoizedFn } from 'ahooks'
import { Button, Flex, FloatButton, message, Modal, Spin, Typography } from 'antd'
import { useRef, useState } from 'react'
import { useSelectedElement } from '@/content/hooks'
import { hackCSS } from '@/css-hacker'
import { ChromeMessageType } from '@/types'
import {
  calculateDiffResultRate,
  chromeMessageSender,
  diffResultFilterRules,
  diffResultProcessor,
  diffResultTipsHandler,
  drawCurrentNodeInfos,
} from '@/utils'
import DiffResultTip from '../diff-result-tip'
import RootDetector from '../root-detector'

type TextType = GetProp<typeof Typography.Text, 'type'>

const designNodeStatusTextMap: Record<'loading' | 'success' | 'error', { text: string, color: TextType }> = {
  loading: {
    text: '加载中',
    color: 'warning',
  },
  success: {
    text: '获取成功',
    color: 'success',
  },
  error: {
    text: '获取失败',
    color: 'danger',
  },
}

export default function DomInfoGetter() {
  const [messageApi, contextHolder] = message.useMessage({ maxCount: 1 })
  const [modelApi, modelContextHolder] = Modal.useModal()
  const [isModalOpen, setIsModalOpen] = useState(false)
  // 设计稿节点信息
  const designNodeInfo = useRef<Map<UniqueId, NodeInfo>>(new Map())
  // 设计稿文档信息
  const designNodeExtraInfo = useRef<Omit<UIDiffBaseInfo, 'pageUrl'>>(void 0)
  // 设计稿节点信息状态
  const [designNodeInfoStatus, setDesignNodeInfoStatus] = useState<'loading' | 'success' | 'error'>('loading')
  // 剪切板loading
  const [modalLoading, setModalLoading] = useState(false)
  // dom节点信息
  const flatNodeMap = useRef<Map<UniqueId, NodeInfo>>(new Map())
  // 比对结果率
  const uiDiffRecordInfo = useRef<UIDiffFieldType>(void 0)

  const rootNodeCls = useRef<string>(void 0)
  const areaDiffPageRoot = useRef<HTMLElement>(void 0)

  function getRootElement() {
    const defaultEle = document.querySelector('#app') || document.querySelector('#root')
    const rootNode = (rootNodeCls.current ? document.querySelector(rootNodeCls.current) : defaultEle?.firstElementChild) as HTMLElement
    return rootNode
  }

  /** 获取剪切板内容 */
  const onReadingClipboard = async () => {
    try {
      const designNodeJSON = await navigator.clipboard.readText()
      if (!designNodeJSON || !designNodeJSON.startsWith(DESIGN_NODE_PREFIX)) {
        messageApi.warning('剪切板中没有设计稿信息')
        return
      }
      const result = designNodeJSON.replace(DESIGN_NODE_PREFIX, '')
      return result
    }
    catch (error) {
      console.error(error)
      messageApi.error('剪切板读取信息失败，请查看权限设置')
    }
  }

  const tooLongDesignPageWarning = async (pageHeight: number) => {
    const screenCount = pageHeight / DEFAULT_PAGE_HEIGHT
    if (screenCount > 5) {
      await modelApi.warning({
        title: '设计稿过长提示',
        content: '设计稿高度较高，超过五屏，可能会影响比对结果，建议使用区域比对的方式进行',
        okText: '我知道了',
      })
    }
  }

  /** 剪切板内容转换成object */
  const handleGetClipboardContent = async () => {
    try {
      setModalLoading(true)
      const designNodeJSON = await onReadingClipboard()
      if (!designNodeJSON) {
        setDesignNodeInfoStatus('error')
        return
      }
      const nodeInfo = JSON.parse(designNodeJSON)
      const { designExtraInfo, designNodeList: nodeList } = nodeInfo

      designNodeExtraInfo.current = designExtraInfo

      if (!Array.isArray(nodeList)) {
        messageApi.warning('设计稿节点不是一个List')
        setDesignNodeInfoStatus('error')
        return
      }

      const entries = nodeList.map((item: NodeInfo) => [item.uniqueId, item] as const)
      designNodeInfo.current = new Map<UniqueId, NodeInfo>(entries)

      const designRoot = entries[0][1]
      const designPageHeight = designRoot.boundingRect.height

      await tooLongDesignPageWarning(designPageHeight)
      setDesignNodeInfoStatus('success')
    }
    catch (error) {
      console.error(error)
      messageApi.error('JSON解析失败')
      setDesignNodeInfoStatus('error')
    }
    finally {
      setModalLoading(false)
    }
  }

  /** 修改设备模拟 */
  const handleChangeWindowSize = async () => {
    const curWidth = document.documentElement.clientWidth
    const curHeight = document.documentElement.clientHeight
    const targetWidth = DEFAULT_PAGE_WIDTH
    const targetHeight = document.documentElement.clientHeight || DEFAULT_PAGE_HEIGHT

    if (curWidth === targetWidth && curHeight === targetHeight) {
      return
    }
    try {
      // 向background script发送修改窗口尺寸的消息
      const response = await chromeMessageSender({ type: ChromeMessageType.CHANGE_WINDOW_SIZE, data: { targetHeight, targetWidth } })
      if (!response?.success) {
        messageApi.error(response?.message || '调用修改窗口尺寸API失败')
        return
      }
      messageApi.success('修改窗口尺寸成功')
    }
    catch (error) {
      console.error('调用设备模拟API失败:', error)
      messageApi.error('调用设备模拟API失败')
    }
  }

  /** 重置设备模拟 */
  const handleResetDeviceEmulation = async () => {
    try {
      // 向background script发送重置设备模拟的消息
      const response = await chromeMessageSender({ type: ChromeMessageType.RESET_DEVICE_EMULATION, data: null })
      if (!response?.success) {
        messageApi.error(response?.message || '调用重置设备模拟API失败')
        return
      }
      messageApi.success('重置设备模拟成功')
    }
    catch (error) {
      console.error('调用重置设备模拟API失败:', error)
      messageApi.error('调用重置设备模拟API失败')
    }
  }

  /** 缓存flatNodeMap */
  const handleCacheFlatNodeMap = () => {
    if (!__DEV__) {
      return
    }
    localStorage.setItem('flatNodeMap', JSON.stringify(Object.fromEntries(flatNodeMap.current.entries())))
  }

  /** 打开 情况弹窗 */
  const handleOpenModal: ButtonProps['onClick'] = async () => {
    setIsModalOpen(true)
  }

  /** 关闭 情况弹窗 */
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  /**
   * dom节点信息链式处理
   */
  const handleDomNodeProcessChain = async (rootNode: HTMLElement) => {
    const rootBounding = rootNode.getBoundingClientRect()
    domConfigs.setRootBounding(rootBounding)
    // 根据设计稿中有无textAutoResize不为宽高的场景，来判断是否需要处理shouldShrinkBounding
    const shouldProcessShouldShrinkBounding = getHasTextAutoResize(Array.from(designNodeInfo.current.values()))
    const result = await onDomInfoRecorder(rootNode)
      // 过滤文档流之外的节点，TODO:  这部分暂时在domInfoRecorder中层序遍历的时候处理掉了
      // .then(filterEmptyNodeAndOutOfDocumentFlowNodes)
      .then(syncTextInfoToTextParentNode)
      .then(processMultiLineTextWidth)
      // 记录行高较大的场景
      .then(processLargeLineHeight)
      .then(nodeMap => processDomNodeShouldShrinkBounding({ flatNodeMap: nodeMap, shouldProcess: shouldProcessShouldShrinkBounding }))
      .then(processDomZZUINode)
      // 搜索初始化的neighbor节点,
      .then(searchNeighborNodesInitial)
      // 去除同位置同大小的子节点（先去除一遍，合并后再去除一遍）
      .then(flatNodeMap => removeSameSizePositionChildren({ flatNodeMap, prevRemove: true }))
      // 处理margin折叠 (11-6: TODO: 这部分实际上已经在hoistingNotBfcBoundaryMargin中预处理完成了)
      .then(processMarginCollapsing)
      // 处理padding信息
      .then(processPaddingInfo)
      // 收缩rect bounding
      .then(shrinkRectBounding)
      // 根据父节点修正宽度
      // 去除同位置同大小的子节点
      .then(flatNodeMap => removeSameSizePositionChildren({ flatNodeMap, prevRemove: false }))
      // 根据父节点的offset重置位置
      // .then(flatNodeMap => processRootDomBounding({ flatNodeMap, isPartDiff: false }))
      // 先匹配，匹配不需要用到neighbor信息
      .then(nodeMap => recordHybridNodeMatchResult(nodeMap, designNodeInfo.current))
      // 初始搜索neighbor信息
      .then(searchNeighborNodes)
      // 根据匹配结果修正neighbor信息[TODO: 有问题，先取消]
      // .then(correctNeighborsByMatchResult)
      // 计算neighbor节点距离
      .then(getNeighborNodeDistance)
    return result
  }

  /** 替换节点文本 */
  const handleReplaceNodeInnerText = async (initialFlatNodeMap: Map<UniqueId, NodeInfo>) => {
    if (!designNodeInfo.current.size) {
      return
    }
    initialFlatNodeMap.forEach((currentNodeInfo) => {
      const currentEl = getDomNodeByUniqueId(currentNodeInfo.uniqueId)
      if (!currentNodeInfo.matchedDesignNodeId)
        return
      const matchedDesignNode = designNodeInfo.current.get(currentNodeInfo.matchedDesignNodeId)
      const designNodeText = matchedDesignNode?.textStyleInfo?.textContent
      const currentContent = currentNodeInfo.textStyleInfo?.textContent
      if (!designNodeText || !currentContent || currentContent === designNodeText)
        return
      if (!currentEl)
        return
      if (currentEl.tagName === 'INPUT') {
        (currentEl as HTMLInputElement).placeholder = designNodeText
        return
      }
      currentEl.textContent = designNodeText
    })
  }

  const handleInitDomInfos = async (rootNode: HTMLElement) => {
    // 修改设备模拟
    await handleChangeWindowSize()
    // 获取剪切板内容
    await handleGetClipboardContent()
    initialDomUUID(rootNode)
    // 处理zz ui
    preProcessZZUITag(rootNode)
    // 先清理无效节点
    clearDomTree(rootNode)
    // 包裹文本节点
    wrapperTextNodeWithSpan(rootNode)
    /** 标记是否从样式表中设定的宽高 */
    markIsSizeFromStyleSheet(rootNode)
    processPriceContainer(rootNode)
    // 检测List节点
    detectListNodes(rootNode)
    // 标记不可见节点
    markUnvisibleNodes(rootNode)
  }

  /** 重置dom文本 */
  const handlePreprocessDomStructs = async (rootNode: HTMLElement, realRootElement?: HTMLElement) => {
    // 先注入css
    await hackCSS()
    markIsSizeFromStyleSheet(rootNode)
    // 改inline样式
    processDomInlineStyle(rootNode)
    // 提升margin
    hoistingNotBfcBoundaryMargin(rootNode)
    // 归一化处理border和divider
    convertSingleBorderToDivider(rootNode)

    if (designNodeInfo.current.size) {
      // 先计算一遍
      const initialFlatNodeMap = await handleDomNodeProcessChain(realRootElement || rootNode)
      // 根据匹配结果替换文本
      await handleReplaceNodeInnerText(initialFlatNodeMap)
      // 等待文本替换完成
      await sleep(500)
    }
  }

  const handleProcessDiffResult = async () => {
    const diffResult = uiDiff(flatNodeMap.current, designNodeInfo.current)
    const filteredCorrectDiffResult = diffResult.filter(resultInfo => diffResultFilterRules(resultInfo, flatNodeMap.current))

    // const pageScreenShot = await generateScreenShot()

    const uiDiffScoreInfo = calculateDiffResultRate({
      flatNodeMap: flatNodeMap.current,
      designNodeInfo: designNodeInfo.current,
      diffResult,
      filteredCorrectDiffResult,
    })

    uiDiffRecordInfo.current = {
      ...uiDiffScoreInfo,
      ...designNodeExtraInfo.current || {},
      pageUrl: location.href,
      pageScreenShot: '',
    }

    const larkCreateResponse = await addLarkRecord({
      fields: uiDiffRecordInfo.current,
    })

    filteredCorrectDiffResult.map(it => diffResultProcessor(it, flatNodeMap.current)).forEach((resultItem) => {
      const { originNode, designNode, distanceResult } = resultItem
      const nodeEl = getDomNodeByUniqueId(originNode.uniqueId)
      const designNodeName = designNode.nodeName
      chalk.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
      chalk.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
      chalk.info(`========匹配分数信息: ${originNode.matchResult?.confidence}========\n`)
      chalk.info('========dom节点:========\n')
      console.info(nodeEl)
      console.info(originNode)
      chalk.info(`========设计稿节点:${designNodeName}========\n`)
      console.info(designNode)
      chalk.info(`========比对结果:========\n`)
      console.info(distanceResult)
      chalk.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
      chalk.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
    })

    if (!__DEV__) {
      await handleResetDeviceEmulation()
    }

    // 节点处理完后关闭弹窗
    setIsModalOpen(false)

    await diffResultTipsHandler({
      diffResultInfo: uiDiffScoreInfo,
      recordId: larkCreateResponse.data.record.record_id ?? '',
    })
  }

  /** 开始UI差异对比 */
  const handleStartFullPageUiDiff = async (rootNode: HTMLElement) => {
    try {
      setModalLoading(true)
      await handlePreprocessDomStructs(rootNode)

      flatNodeMap.current = await handleDomNodeProcessChain(rootNode)

      handleCacheFlatNodeMap()
      await handleProcessDiffResult()
    }
    finally {
      setModalLoading(false)
    }
  }

  /** dev下快速测试 */
  const handleQuickStartUIDiff = async () => {
    const rootNode = getRootElement()
    if (!rootNode)
      return

    await handleInitDomInfos(rootNode)

    await handleStartFullPageUiDiff(rootNode)
  }

  /** 绘制区域 */
  const handleTestDomNodeProcessor = async () => {
    const rootNode = getRootElement()
    if (!rootNode)
      return
    await handleInitDomInfos(rootNode as HTMLElement)
    await handlePreprocessDomStructs(rootNode as HTMLElement)
    flatNodeMap.current = await handleDomNodeProcessChain(rootNode as HTMLElement)
    handleCacheFlatNodeMap()
    drawCurrentNodeInfos(flatNodeMap.current)
  }

  /** 更新root节点 */
  const handleUpdateRootNodeName = (rootClsName: string) => {
    rootNodeCls.current = rootClsName
  }

  /** 测试替换节点文本 */
  const handleReplaceNodeInnerTextTest = async () => {
    const rootNode = getRootElement()
    if (!rootNode)
      return

    await handleInitDomInfos(rootNode as HTMLElement)
    await handlePreprocessDomStructs(rootNode as HTMLElement)
    flatNodeMap.current = await handleDomNodeProcessChain(rootNode as HTMLElement)
    handleCacheFlatNodeMap()
  }
  /** 测试border转divider */
  const handleBorderToDividerTest = async () => {
    const rootNode = getRootElement()
    if (!rootNode)
      return
    convertSingleBorderToDivider(rootNode as HTMLElement)
  }

  /** 测试margin提升 */
  const handleHoistingNotBfcBoundaryMarginTest = async () => {
    const rootNode = getRootElement()
    if (!rootNode)
      return
    hoistingNotBfcBoundaryMargin(rootNode as HTMLElement)
  }

  const designNodeInfoText = designNodeStatusTextMap[designNodeInfoStatus]

  const handleSelectorChangeCallback = useMemoizedFn(async (currentSelector?: string) => {
    if (!currentSelector) {
      messageApi.warning('未选中区域diff的节点')
      return
    }
    const targetRootNode = document.querySelector(currentSelector) as HTMLElement
    if (!targetRootNode || !areaDiffPageRoot.current)
      return
    try {
      setModalLoading(true)
      await handleInitDomInfos(areaDiffPageRoot.current)
      await handlePreprocessDomStructs(areaDiffPageRoot.current, targetRootNode)

      flatNodeMap.current = await handleDomNodeProcessChain(targetRootNode)
      handleCacheFlatNodeMap()
      await handleProcessDiffResult()
    }
    catch (error) {
      console.log('🚀 ~ handleChooseDiffArea ~ error:', error)
      if (error instanceof Error) {
        messageApi.error(error.message || '获取选中元素失败')
        return
      }
      messageApi.error('获取选中元素失败')
    }
    finally {
      setModalLoading(false)
    }
  })

  const { requestDevToolsSelection } = useSelectedElement({ messageApi, areaDiffCallback: handleSelectorChangeCallback })

  const handleRequestAreaDiff = (pageRootNode: HTMLElement) => {
    areaDiffPageRoot.current = pageRootNode
    return requestDevToolsSelection()
  }

  const handleTestAreaDiff = async () => {
    const rootNode = getRootElement()
    if (!rootNode)
      return

    handleRequestAreaDiff(rootNode)
    drawCurrentNodeInfos(flatNodeMap.current)
  }

  const handleRealAreaDiff = async () => {
    const rootNode = getRootElement()
    if (!rootNode)
      return

    handleRequestAreaDiff(rootNode)
  }

  const handleTestPing = () => {
    return getLarkRecordList()
  }

  return (
    <>
      {contextHolder}
      {modelContextHolder}
      {!__DEV__
        && (
          <>
            <FloatButton
              icon={<Icon icon="tabler:bomb-filled" />}
              type="default"
              onClick={handleRealAreaDiff}
            />
          </>

        )}
      {!!__DEV__ && (
        <>
          <FloatButton icon={<Icon icon="line-md:uploading-loop" style={{ color: '#2000f7' }} />} type="default" onClick={handleTestPing} />
          {/* <FloatButton
            icon={<Icon icon="eos-icons:test-tube" />}
            type="default"
            onClick={handleTestCookies}
          /> */}
          <FloatButton
            icon={<Icon icon="cuida:short-text-outline" />}
            type="default"
            onClick={handleTestAreaDiff}
          />
          <FloatButton
            icon={<Icon icon="cuida:edit-outline" />}
            type="default"
            onClick={handleTestDomNodeProcessor}
          />
          <FloatButton
            icon={<Icon icon="tabler:bomb-filled" />}
            type="default"
            onClick={handleQuickStartUIDiff}
          />
        </>
      )}

      <FloatButton
        styles={{
          icon: { fontSize: '40px', display: 'flex' },
          root: { padding: 0, border: 0 },
        }}
        icon={<span className="ui-differ-icon" />}
        type="default"
        onClick={handleOpenModal}
      />

      <Modal
        title="Dom节点检测"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        maskClosable={false}
        width={800}
        centered
        destroyOnHidden
      >
        <Spin spinning={modalLoading}>
          <RootDetector
            onInitDomInfos={handleInitDomInfos}
            onClose={handleCloseModal}
            onConfirm={handleStartFullPageUiDiff}
            updateRootNodeName={handleUpdateRootNodeName}
            onChooseDiffArea={handleRequestAreaDiff}
          />
          <Flex gap={8}>
            <Typography.Text type={designNodeInfoText.color}>
              设计稿节点信息状态：
              {designNodeInfoText.text}
            </Typography.Text>
            <Button variant="filled" color="blue" onClick={handleGetClipboardContent}>
              重新获取剪切板内容
            </Button>
          </Flex>
          {!!__DEV__ && (
            <Flex wrap gap={16}>
              <Button variant="filled" color="magenta" onClick={handleResetDeviceEmulation}>
                重置设备模拟
              </Button>
              <Button variant="filled" color="gold" onClick={handleChangeWindowSize}>
                调整设备模拟
              </Button>
              <Button variant="filled" color="red" onClick={handleTestDomNodeProcessor}>
                dom数据处理测试
              </Button>
              <Button variant="filled" color="volcano" onClick={handleReplaceNodeInnerTextTest}>
                替换文本测试
              </Button>
              <Button variant="filled" color="volcano" onClick={handleBorderToDividerTest}>
                border转换为divider测试
              </Button>
              <Button variant="filled" color="volcano" onClick={handleHoistingNotBfcBoundaryMarginTest}>
                margin提升测试
              </Button>
            </Flex>
          )}
        </Spin>
      </Modal>
      <DiffResultTip />
    </>
  )
}
