import type { ExpectionScoreReportRequest } from '@ui-differ/connection-tools'
import type { CollapseProps } from 'antd'
import type { ReactNode } from 'react'
import { expectionReport } from '@ui-differ/connection-tools'
import { useRequest } from 'ahooks'
import { Button, Collapse, Flex, Form, Input, Spin, theme, Typography } from 'antd'
import { useState } from 'react'
import { useDiffResultTipInfo } from '@/stores'
import { DiffResultTypeEnum } from '@/types'
import styles from './index.module.scss'

const { Text } = Typography

export default function DiffResultTipContent() {
  const { cssVar } = theme.useToken()
  const resultTipStore = useDiffResultTipInfo()
  const [activityKey, setActivity] = useState<string[]>()
  const [form] = Form.useForm()
  const isSubmitterOpen = activityKey?.includes('expection-submitter')

  /** 打开反馈入口 */
  const handleOpenSubmitter = () => {
    setActivity(['expection-submitter'])
  }

  /** 修改反馈入口的展开状态 */
  const handleChangeSubmitter: CollapseProps['onChange'] = (key) => {
    setActivity(key)
  }

  /** 关闭弹窗 */
  const handleCloseModal = () => {
    return resultTipStore.updateTipsModalStatus(false)
  }

  /** 提交异常 */
  const expectionSubmitRequest = useRequest(async (values: Pick<ExpectionScoreReportRequest, 'designUrl' | 'proxyInfo'>) => {
    const { combinedRecord, pageUrl, currentRecordId, expectionType, loginPPU } = resultTipStore
    const fullSubmitParams: ExpectionScoreReportRequest = {
      combinedRecord,
      pageUrl,
      currentRecordId,
      expectionType,
      loginPPU,
      ...values,
    }
    return expectionReport(fullSubmitParams)
  }, {
    manual: true,
    onSuccess: handleCloseModal,
  })

  /** 比对结果类型 */
  const diffResultTipContentMap: Record<DiffResultTypeEnum, ReactNode> = {
    [DiffResultTypeEnum.ABNORMAL_DESIGN_COUNT]: `设计稿${resultTipStore.designNodeCount}个节点,前端${resultTipStore.htmlNodeCount}个节点\n节点数量异常,确认下设计稿节点选对了没有?`,
    [DiffResultTypeEnum.LOW_MATCH_RATE_BUT_PASS]: `当前的匹配率${((resultTipStore.matchRate ?? 0) * 100).toFixed(2)}%, 匹配率有点低呀,试试区域比对?`,
    [DiffResultTypeEnum.LOW_MATCH_RATE_AND_FAIL]: `当前的匹配率${((resultTipStore.matchRate ?? 0) * 100).toFixed(2)}%, 匹配率有点低呀,试试区域比对?`,
    [DiffResultTypeEnum.MATCH_RATE_ABNORMAL]: (
      <>
        <Text>
          匹配率
          {((resultTipStore.matchRate ?? 0) * 100).toFixed(2)}
          %, 当前匹配率过低,确认"顶部排除类型"选择正确后重试。
        </Text>
        <Button variant="link" color="danger" onClick={handleOpenSubmitter}>异常上报</Button>
      </>
    ),
    [DiffResultTypeEnum.PASS]: '走查通过啦,进入人工走查阶段了!',
    [DiffResultTypeEnum.FAIL]: '走查不通过哦,用叠图工具自查一下吧',
  }

  const items: CollapseProps['items'] = [
    {
      key: 'expection-submitter',
      label: '异常反馈',
      children: (
        <>
          <Form.Item name="设计稿Url" rules={[{ required: true }]} label="设计稿url">
            <Input placeholder="请输入设计稿url" />
          </Form.Item>
          <Form.Item name="测试代理" rules={[{ required: true }]} label="测试代理">
            <Input.TextArea placeholder="请输入测试代理" autoSize={{ minRows: 4, maxRows: 4 }} />
          </Form.Item>
        </>
      ),
    },
  ]

  return (
    <Spin spinning={expectionSubmitRequest.loading}>
      <Flex vertical gap="small">
        <Text>{!!resultTipStore.type && diffResultTipContentMap[resultTipStore.type]}</Text>
        <Form form={form} styles={{ root: { marginTop: '16px' } }} onFinish={expectionSubmitRequest.run}>
          <Collapse
            activeKey={activityKey}
            ghost
            items={items}
            onChange={handleChangeSubmitter}
            styles={{
              icon: { color: cssVar.colorTextDescription },
              title: { color: cssVar.colorTextDescription, display: 'flex' },
              body: { padding: 0 },
            }}
            classNames={{
              root: styles.submitAreaContent,
              header: styles.submitAreaContentHeader,
            }}
          />
          <Form.Item noStyle>
            <Flex gap="middle" justify="end" align="center">
              {isSubmitterOpen
                ? <Button autoFocus={false} variant="solid" color="primary" htmlType="submit">提交反馈</Button>
                : <Button variant="solid" color="primary" onClick={handleCloseModal}>我知道了</Button>}
            </Flex>
          </Form.Item>
        </Form>
      </Flex>
    </Spin>
  )
}
