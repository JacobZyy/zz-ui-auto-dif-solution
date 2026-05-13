import { Icon } from '@iconify/react'
import type { PluginMessageType } from '@ui-differ/mastergo-shared/lib'
import { PluginMessage, sendUIMsgToPlugin, UIMessage } from '@ui-differ/mastergo-shared/lib'
import { Button, Flex } from 'antd'
import { useEffect } from 'react'
import {
  CombineMaskLayer,
  CombineSliceLayer,
  HoistingRectangleStyle,
  OperationBannerItem,
  ProcessOverflowHidden,
  RemoveUselessLayers,
  UnifiedLineHeight,
} from './components'
import { useDetectPageStore, useRouteStore, PageConfig } from '@/stores'
import styles from './index.module.scss'

// 修复响应类型 → 步骤索引 映射
const FIX_STEP_MAP: Record<string, number> = {
  [PluginMessage.COMBINE_MASK_FIXED]: 2,
  [PluginMessage.COMBINE_SLICE_FIXED]: 3,
  [PluginMessage.HOISTING_RECTANGLE_FIXED]: 4,
  [PluginMessage.UNIFIED_LINE_HEIGHT_FIXED]: 5,
  [PluginMessage.OVERFLOW_HIDDEN_FIXED]: 6,
}

export function DetectPage() {
  const routeHandler = useRouteStore()
  const { activeStep, completedSteps, targetRootNodeId, freezeTarget, reset, updateStep, markStepDone } = useDetectPageStore()

  // 进入页面时通过消息获取当前选择节点
  useEffect(() => {
    const handleCurrentSelection = (event: MessageEvent<PluginMessageType>) => {
      const { type, data } = event.data
      if (type !== PluginMessage.CURRENT_SELECTION)
        return
      if (data?.id) {
        freezeTarget(data.id, data.name)
      }
    }
    window.addEventListener('message', handleCurrentSelection)
    sendUIMsgToPlugin({ type: UIMessage.GET_CURRENT_SELECTION })
    return () => window.removeEventListener('message', handleCurrentSelection)
  }, [])

  // 监听修复完成消息，标记步骤完成
  useEffect(() => {
    const handleFixComplete = (event: MessageEvent<PluginMessageType>) => {
      const { type } = event.data
      const step = FIX_STEP_MAP[type]
      if (step && !completedSteps.includes(step)) {
        markStepDone(step)
      }
    }
    window.addEventListener('message', handleFixComplete)
    return () => window.removeEventListener('message', handleFixComplete)
  }, [completedSteps])

  const handleGoBack = () => {
    reset()
    routeHandler.back()
  }

  // 基础4步已完成，底部引导进入高级
  const showAdvancedBanner = completedSteps.length >= 4 && activeStep < 5

  // 基础+高级6步全部完成，路由到结果页
  const allDone = completedSteps.length >= 6

  useEffect(() => {
    if (allDone) {
      routeHandler.navigateTo(PageConfig.RESULT_PAGE)
    }
  }, [allDone])

  return (
    <Flex vertical gap="small" style={{ width: '100%', height: '100%' }}>
      <header className={styles['detect-page-header']}>
        <div className={styles['detect-header-left']} onClick={handleGoBack}>
          <Icon fontSize="32px" icon="famicons:chevron-back-circle" />
        </div>
        <div className={styles['detect-header-content']}>设计稿预处理</div>
        <div className={styles['detect-header-right']}></div>
      </header>

      <main className={styles['detect-steps-container']}>
        {/* 基础清理档（步骤 1-4） */}
        <RemoveUselessLayers itemIdx={1} />
        <CombineMaskLayer itemIdx={2} />
        <CombineSliceLayer itemIdx={3} />
        <HoistingRectangleStyle itemIdx={4} />

        {/* 高级预处理档（步骤 5-6），仅在 Banner 引导后展示 */}
        {activeStep >= 5 && (
          <>
            <UnifiedLineHeight itemIdx={5} />
            <ProcessOverflowHidden itemIdx={6} />
          </>
        )}

        {/* 基础4步完成后底部引导 Banner */}
        {showAdvancedBanner && (
          <div className={styles['advanced-banner']}>
            <span>检测到高级优化项，是否继续？</span>
            <Button
              size="small"
              variant="filled"
              color="blue"
              onClick={() => updateStep(5)}
            >
              继续高级预处理
            </Button>
          </div>
        )}
      </main>
    </Flex>
  )
}
