import { Icon } from '@iconify/react'
import { SelectionDisplay } from '@ui-differ/mastergo-shared/ui'
import { Button, Card, Flex, Tag, theme } from 'antd'
import { PageConfig, useRouteStore } from '@/stores'
import styles from './index.module.scss'

export function HomePage() {
  const { cssVar } = theme.useToken()
  const routeHandler = useRouteStore()

  const handleGoToDetectPage = () => {
    routeHandler.navigateTo(PageConfig.DETECT_PAGE)
  }

  return (
    <Flex vertical gap="small" style={{ width: '100%', height: '100%' }}>
      <header className={styles.homeHeader}>
        <Icon className={styles.homeHeaderIcon} icon="noto:man-detective" />
        <div className={styles.homeHeaderTitle}>ui检测工具-首页</div>
      </header>
      <div className={styles.previewContainer}>
        <Card size="small" variant="borderless" classNames={{ root: styles.previewCardRoot, body: styles.previewCardBody }}>
          <SelectionDisplay className={styles.previewImage} />
        </Card>
        <Tag variant="filled" color="lime" className={styles.previewTitleTag}>设计图总览</Tag>
      </div>
      <div className={styles.optContainer}>
        <Button className={styles.optBannerItem} size="large" onClick={handleGoToDetectPage}>
          <div className={styles.optBannerIcon}>
            <Icon icon="stash:search-results" style={{ color: cssVar.colorPrimary }} />
          </div>
          <div className={styles.optBannerContent}>
            <div className={styles.optBannerTitle}>设计稿分组检测</div>
            <div className={styles.optBannerSubtitle}>检测并修复设计稿中的问题</div>
          </div>
        </Button>
        <Button className={styles.optBannerItem} size="large">
          <div className={styles.optBannerIcon}>
            <Icon icon="carbon:result-new" style={{ color: cssVar.colorSuccess }} />
          </div>
          <div className={styles.optBannerContent}>
            <div className={styles.optBannerTitle}>查看走查结果</div>
            <div className={styles.optBannerSubtitle}>查看当前设计图的自动化走查结果</div>
          </div>
        </Button>
      </div>
    </Flex>
  )
}
