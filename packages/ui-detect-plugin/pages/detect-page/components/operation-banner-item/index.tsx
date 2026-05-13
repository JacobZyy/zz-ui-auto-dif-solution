import { Icon } from '@iconify/react'
import type { PluginMessageType } from '@ui-differ/mastergo-shared/lib'
import { PluginMessage, sendUIMsgToPlugin, UIMessage } from '@ui-differ/mastergo-shared/lib'
import { useMemoizedFn } from 'ahooks'
import { Button, Divider } from 'antd'
import { produce } from 'immer'
import { Fragment, useEffect, useState } from 'react'
import { useDetectPageStore } from '@/stores'
import styles from './index.module.scss'
import { OperationArea } from './operation-area'

export interface OperationNodeItem {
  id: string
  name: string
  description?: string
}

interface OperationBannerItemProps {
  /** 获取问题节点的请求函数 */
  uiMsgSender: () => void
  /** 问题节点的监听函数 */
  uiMsgProcessor: (event: MessageEvent) => Promise<OperationNodeItem[]>
  /** 修复节点的回调 */
  onFixHandler: (nodeList: OperationNodeItem[]) => void
  /** 标题 */
  title: string
  /** 副标题 */
  subtitle: string
  /** 序号 */
  itemIdx: number
}

export function OperationBannerItem({
  uiMsgProcessor,
  uiMsgSender,
  onFixHandler,
  title,
  subtitle,
  itemIdx,
}: OperationBannerItemProps) {
  const [nodeList, setNodeList] = useState<OperationNodeItem[]>([])
  const { activeStep, completedSteps, backupCreated, targetRootNodeId, markStepDone, setBackupCreated } = useDetectPageStore()
  const [fixedNodeSet, setFixedNodeSet] = useState<Set<string>>(new Set())
  const [ignoredIdSet, setIgnoredIdSet] = useState<Set<string>>(new Set())
  /** 是否被激活 */
  const isStepActive = activeStep === itemIdx

  /** 备份完成监听 */
  const onBackupComplete = useMemoizedFn((event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type !== PluginMessage.BACKUP_COMPLETED)
      return
    if (data?.success) {
      setBackupCreated()
    }
  })

  useEffect(() => {
    window.addEventListener('message', onBackupComplete)
    return () => window.removeEventListener('message', onBackupComplete)
  }, [])

  /** 执行修复（带自动备份） */
  const executeFix = () => {
    if (!backupCreated && targetRootNodeId) {
      sendUIMsgToPlugin({ type: UIMessage.BACKUP_DESIGN_NODES, data: { targetNodeId: targetRootNodeId } })
    }
    const targetIdList = Array.from(nodeList.map(it => it.id).filter(it => !ignoredIdSet.has(it)))
    setFixedNodeSet(new Set(targetIdList))
    onFixHandler(nodeList)
  }

  /** 修复所有异常 */
  const onFixAllExpections = () => {
    executeFix()
  }

  /** 修复单个异常 */
  const onFixSingleNode = (nodeItem: OperationNodeItem) => {
    return () => {
      if (!backupCreated && targetRootNodeId) {
        sendUIMsgToPlugin({ type: UIMessage.BACKUP_DESIGN_NODES, data: { targetNodeId: targetRootNodeId } })
      }
      onFixHandler([nodeItem])
      setFixedNodeSet(produce((draft) => {
        draft.add(nodeItem.id)
      }))
    }
  }

  /** 忽略逻辑 */
  const onIngoreNodes = (nodeList: OperationNodeItem[]) => {
    const idList = nodeList.map(it => it.id)
    setIgnoredIdSet((prev) => {
      const prevList = Array.from(prev)
      return new Set([...prevList, ...idList])
    })
  }

  /** 取消单个忽略 */
  const onCancelIgnore = (nodeItem: OperationNodeItem) => {
    return () => {
      setIgnoredIdSet(produce((draft) => {
        draft.delete(nodeItem.id)
      }))
    }
  }

  /** 取消忽略全部 */
  const onCancelAllIgnore = () => {
    setIgnoredIdSet(new Set())
  }

  /** 忽略异常 */
  const onIgnoreSingleNode = (nodeItem: OperationNodeItem) => {
    return () => onIngoreNodes([nodeItem])
  }

  /** 忽略全部 */
  const onIgnoreAllNodes = () => {
    return onIngoreNodes(nodeList)
  }

  /** 定位节点 */
  const handleShowCurrentNode = (nodeItem: OperationNodeItem) => {
    return () => {
      sendUIMsgToPlugin({ type: UIMessage.LOCATE_NODE, data: nodeItem.id })
    }
  }

  /** 发送节点获取参数 */
  const onInitNodeList = () => {
    if (!!nodeList.length || !isStepActive) {
      return
    }
    uiMsgSender()
  }

  /** 节点数据监听 */
  const onNodeListGetter = useMemoizedFn(async (message: MessageEvent) => {
    const result = await uiMsgProcessor(message)
    if (!result?.length)
      return
    setNodeList(result)
  })

  useEffect(() => {
    onInitNodeList()
  }, [isStepActive])

  useEffect(() => {
    window.addEventListener('message', onNodeListGetter)
    return () => {
      window.removeEventListener('message', onNodeListGetter)
    }
  }, [])

  return (
    <div className={styles.operationBanner}>
      <div className={styles.operationMainBanner}>
        <div className={styles.operationMainOrder}>
          {itemIdx}
        </div>
        <div className={styles.operationMainContent}>
          <div className={styles.operationMainContentTitle}>
            {title}
          </div>
          <div className={styles.operationMainContentSubtitle}>
            {subtitle}
          </div>
        </div>

        <div className={styles.operationMainOptarea}>
          <OperationArea
            nodeCount={nodeList.length}
            ignoredIdSet={ignoredIdSet}
            fixedNodeSet={fixedNodeSet}
            isItemActive={isStepActive}
            onFixAllHandler={onFixAllExpections}
            onIgnoreAllHandler={onIgnoreAllNodes}
            onCancelAllIgnoreHandler={onCancelAllIgnore}
          />
        </div>

      </div>
      {!!nodeList.length && <Divider style={{ margin: '12px 0' }} />}
      <div className={styles.operationDetailContainer}>
        {nodeList.map((nodeItem, nodeIdx) => (
          <Fragment key={nodeItem.id}>
            <div className={styles.operationDetailItem}>
              <div className={styles.operationDetailOrder}>{nodeIdx + 1}</div>
              <div className={styles.operationDetailContent}>{nodeItem.name}</div>
              <div className={styles.operationDetailBtnArea}>
                <Button
                  styles={{ content: { fontSize: '12px' }, icon: { fontSize: '12px' } }}
                  variant="filled"
                  shape="round"
                  color="blue"
                  size="small"
                  icon={<Icon icon="streamline-flex:iris-scan-remix" />}
                  onClick={handleShowCurrentNode(nodeItem)}
                >
                  定位
                </Button>
                {ignoredIdSet.has(nodeItem.id)
                  && (
                    <Button
                      styles={{ content: { fontSize: '12px' }, icon: { fontSize: '12px' } }}
                      variant="filled"
                      shape="round"
                      color="red"
                      size="small"
                      icon={<Icon icon="streamline-flex:invisible-1-remix" />}
                      onClick={onCancelIgnore(nodeItem)}
                    >
                      已忽略
                    </Button>
                  )}
                {fixedNodeSet.has(nodeItem.id) && (
                  <Button
                    styles={{ content: { fontSize: '12px' }, icon: { fontSize: '12px' } }}
                    variant="filled"
                    shape="round"
                    color="green"
                    size="small"
                    icon={<Icon icon="streamline-flex:check-square-remix" />}
                  >
                    已修复
                  </Button>
                )}
                {!fixedNodeSet.has(nodeItem.id) && !ignoredIdSet.has(nodeItem.id) && (
                  <>
                    <Button
                      styles={{ content: { fontSize: '12px' }, icon: { fontSize: '12px' } }}
                      variant="filled"
                      shape="round"
                      color="gold"
                      size="small"
                      icon={<Icon icon="streamline-flex:invisible-1-remix" />}
                      onClick={onIgnoreSingleNode(nodeItem)}
                    >
                      忽略
                    </Button>
                    <Button
                      styles={{ content: { fontSize: '12px' }, icon: { fontSize: '12px' } }}
                      variant="filled"
                      shape="round"
                      color="green"
                      size="small"
                      icon={<Icon icon="streamline-flex:check-square-remix" />}
                      onClick={onFixSingleNode(nodeItem)}
                    >
                      修复
                    </Button>
                  </>
                )}
              </div>

            </div>
            {nodeIdx !== nodeList.length - 1 && <Divider style={{ margin: '12px 0' }} />}
          </Fragment>
        ))}
      </div>

    </div>
  )
}
