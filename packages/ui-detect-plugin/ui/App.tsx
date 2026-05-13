import type { ReactNode } from 'react'
import { theme } from 'antd'
import { DetectPage, HomePage, ResultPage } from '@/pages'
import { PageConfig, useRouteStore } from '@/stores'

const pageRouteMap: Partial<Record<PageConfig, ReactNode>> = {
  [PageConfig.HOME_PAGE]: <HomePage />,
  [PageConfig.DETECT_PAGE]: <DetectPage />,
  [PageConfig.RESULT_PAGE]: <ResultPage />,
}

export default function App() {
  const { cssVar } = theme.useToken()
  const currentPage = useRouteStore(state => state.currentPage)
  const currentPageComponent = pageRouteMap[currentPage]

  return (
    <div style={{ background: cssVar.colorBgBase, width: '100%', height: '100%' }}>
      {currentPageComponent}
    </div>
  )
}
