import { Icon } from '@iconify/react'
import { Button, Tag } from 'antd'

interface OperationAreaProps {
  ignoredIdSet: Set<string>
  fixedNodeSet: Set<string>
  nodeCount: number
  isItemActive: boolean
  onFixAllHandler: () => void
  onIgnoreAllHandler: () => void
  onCancelAllIgnoreHandler: () => void
}

export function OperationArea({
  ignoredIdSet,
  fixedNodeSet,
  nodeCount,
  isItemActive,
  onCancelAllIgnoreHandler,
  onFixAllHandler,
  onIgnoreAllHandler,
}: OperationAreaProps) {
  const isAllIgnored = !!ignoredIdSet.size && ignoredIdSet.size === nodeCount

  const getUnActiveTextInfo = () => {
    const isAllHandled = ignoredIdSet.size + fixedNodeSet.size === nodeCount
    if (isAllHandled) {
      return <Tag variant="solid" color="success">已完成</Tag>
    }
    const processedPercentage = Math.floor((ignoredIdSet.size + fixedNodeSet.size) / nodeCount * 100) / 100
    if (!processedPercentage) {
      return <Tag variant="solid" color="lime">未完成</Tag>
    }
    return (
      <Tag variant="solid" color="cyan">
        {processedPercentage}
        %
      </Tag>
    )
  }
  return (
    <>
      {!isItemActive && getUnActiveTextInfo()}
      {isItemActive && (
        <>
          {!isAllIgnored && (
            <Button
              variant="filled"
              color="gold"
              size="small"
              icon={<Icon icon="streamline:invisible-1-solid" />}
              onClick={onIgnoreAllHandler}
            >
              忽略全部
            </Button>
          )}
          {isAllIgnored && (
            <Button
              variant="filled"
              color="gold"
              size="small"
              icon={<Icon icon="streamline:invisible-1-solid" />}
              onClick={onCancelAllIgnoreHandler}
            >
              已忽略
            </Button>
          )}
          <Button
            variant="filled"
            color="green"
            size="small"
            icon={<Icon icon="streamline-flex:check-square-remix" />}
            onClick={onFixAllHandler}
          >
            修复全部
          </Button>
        </>
      )}
    </>
  )
}
