import { Icon } from '@iconify/react'
import { Button, Flex, Tag } from 'antd'
import { useDetectPageStore, useRouteStore, PageConfig } from '@/stores'
import styles from './index.module.scss'

export function ResultPage() {
  const routeHandler = useRouteStore()
  const { completedSteps, reset } = useDetectPageStore()

  const handleGoBack = () => {
    reset()
    routeHandler.navigateTo(PageConfig.HOME_PAGE)
  }

  const handleRetry = () => {
    reset()
    routeHandler.navigateTo(PageConfig.DETECT_PAGE)
  }

  const stepNames: Record<number, string> = {
    1: '移除无用图层',
    2: '蒙版图层合并',
    3: '切图图层处理',
    4: '背景样式上提',
    5: '统一行高',
    6: '溢出隐藏处理',
  }

  const completedNames = completedSteps.map(s => stepNames[s]).filter(Boolean)

  return (
    <Flex vertical gap="small" style={{ width: '100%', height: '100%' }}>
      <header className={styles['result-page-header']}>
        <div className={styles['result-header-left']} onClick={handleGoBack}>
          <Icon fontSize="32px" icon="famicons:chevron-back-circle" />
        </div>
        <div className={styles['result-header-content']}>预处理完成</div>
        <div className={styles['result-header-right']}></div>
      </header>

      <main className={styles['result-summary-container']}>
        <div className={styles['summary-card']}>
          <Flex justify="center" align="center" vertical>
            <Icon className={styles['success-icon']} icon="emojione-monotone:check-mark-with-circle" />
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>预处理完成</div>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
              已完成 {completedSteps.length} 项优化处理
            </div>
          </Flex>

          <div className={styles['summary-title']}>完成详情</div>

          {completedNames.length > 0 ? (
            <Flex gap="small" wrap>
              {completedNames.map(name => (
                <Tag key={name} color="success" variant="dot">{name}</Tag>
              ))}
            </Flex>
          ) : (
            <div style={{ color: '#999', fontSize: 14 }}>未执行任何优化</div>
          )}
        </div>

        <div className={styles['summary-card']} style={{ marginTop: 8 }}>
          <div className={styles['summary-title']}>处理统计</div>
          <div className={styles['summary-stat']}>
            <span className={styles['stat-label']}>基础预处理</span>
            <span className={styles['stat-value']}>
              {completedSteps.filter(s => s <= 4).length} / 4 项
            </span>
          </div>
          <div className={styles['summary-stat']}>
            <span className={styles['stat-label']}>高级预处理</span>
            <span className={styles['stat-value']}>
              {completedSteps.filter(s => s > 4).length} / 2 项
            </span>
          </div>
        </div>
      </main>

      <footer className={styles['result-footer']}>
        <Button onClick={handleGoBack}>返回首页</Button>
        <Button variant="filled" color="blue" onClick={handleRetry}>再次检测</Button>
      </footer>
    </Flex>
  )
}
