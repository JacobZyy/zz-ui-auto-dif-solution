import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export enum PageConfig {
  HOME_PAGE = 'HOME',
  DETECT_PAGE = 'DETECT',
  RESULT_PAGE = 'RESULT',
}

interface PageStore {
  currentPage: PageConfig
  pathHistory: PageConfig[]
  navigateTo: (path: PageConfig) => void
  back: () => void
}

export const useRouteStore = create(immer<PageStore>(set => ({
  currentPage: PageConfig.HOME_PAGE,
  pathHistory: [],
  navigateTo: (newPage) => {
    set((state) => {
      state.pathHistory.push(state.currentPage)
      state.currentPage = newPage
    })
  },
  back: () => {
    set((state) => {
      if (state.pathHistory.length < 1)
        return
      const originPage = state.pathHistory.pop()
      if (!originPage)
        return
      state.currentPage = originPage
    })
  },
})))
