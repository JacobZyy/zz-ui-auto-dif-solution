import type { ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { Flex, Modal, theme } from 'antd'
import { useMemo } from 'react'
import { useDiffResultTipInfo } from '@/stores'
import { DiffResultTypeEnum, diffResultTypeEnumRecord } from '@/types'
import DiffResultTipContent from './diff-result-tip-content'
import styles from './index.module.scss'

const hideScoreTypes = new Set([
  DiffResultTypeEnum.ABNORMAL_DESIGN_COUNT,
  DiffResultTypeEnum.MATCH_RATE_ABNORMAL,
])

export default function DiffResultTip() {
  const resultTipStore = useDiffResultTipInfo()
  const { cssVar } = theme.useToken()

  const titleIconMap: Record<DiffResultTypeEnum, ReactNode> = {
    [DiffResultTypeEnum.ABNORMAL_DESIGN_COUNT]: <Icon icon="ant-design:close-circle-filled" style={{ color: cssVar.colorError, fontSize: '24px' }} />,
    [DiffResultTypeEnum.LOW_MATCH_RATE_BUT_PASS]: <Icon icon="ant-design:exclamation-circle-filled" style={{ color: cssVar.colorWarning, fontSize: '24px' }} />,
    [DiffResultTypeEnum.LOW_MATCH_RATE_AND_FAIL]: <Icon icon="ant-design:close-circle-filled" style={{ color: cssVar.colorError, fontSize: '24px' }} />,
    [DiffResultTypeEnum.MATCH_RATE_ABNORMAL]: <Icon icon="ant-design:close-circle-filled" style={{ color: cssVar.colorError, fontSize: '24px' }} />,
    [DiffResultTypeEnum.PASS]: <Icon icon="ant-design:check-circle-filled" style={{ color: cssVar.colorSuccess, fontSize: '24px' }} />,
    [DiffResultTypeEnum.FAIL]: <Icon icon="ant-design:close-circle-filled" style={{ color: cssVar.colorError, fontSize: '24px' }} />,
  }

  const tipsTitle = useMemo(() => {
    if (!resultTipStore.type)
      return ''
    const baseTitleText = diffResultTypeEnumRecord[resultTipStore.type]

    if (hideScoreTypes.has(resultTipStore.type)) {
      return baseTitleText
    }
    return `${baseTitleText}（${resultTipStore.score}分）`
  }, [resultTipStore.type])

  const handleCloseModal = () => {
    return resultTipStore.updateTipsModalStatus(false)
  }
  return (
    <Modal
      open={resultTipStore.resultModalOpen}
      title={(
        <Flex gap="small" align="center">
          {titleIconMap[resultTipStore.type]}
          {tipsTitle}
        </Flex>
      )}
      okText="确认"
      footer={null}
      onCancel={handleCloseModal}
      classNames={{ body: styles.submitTriggerContent }}
    >
      <DiffResultTipContent />
    </Modal>
  )
}
