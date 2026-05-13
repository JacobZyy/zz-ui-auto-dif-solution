import type { DiffResultTipsInfo } from '../types/enums'
import { create } from 'zustand'
import { DiffResultTypeEnum } from '../types/enums'

type DiffResultTipsInfoStore = DiffResultTipsInfo & {
  resultModalOpen: boolean
  updateTipsInfo: (tipsInfo: DiffResultTipsInfo) => void
  updateTipsModalStatus: (open: boolean) => void
}

export const useDiffResultTipInfo = create<DiffResultTipsInfoStore>(set => ({
  resultModalOpen: false,
  type: DiffResultTypeEnum.FAIL,
  expectionType: 'empty',
  score: 0,
  matchRate: 0,
  designNodeCount: 0,
  htmlNodeCount: 0,
  updateTipsInfo: tipsInfo => set(() => ({ ...tipsInfo })),
  updateTipsModalStatus: open => set(() => ({ resultModalOpen: open })),
}))
