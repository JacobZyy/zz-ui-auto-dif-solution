import type { Draft } from 'immer'
import type { NodeInfo } from '../../types'
import { ZZ_UI_TAG } from '../../types'
import { swipeIndicatorCallback, zzDividerCallback, zzFixedTopContainerCallback, zzIconCallback, zzNoticeBarCallback } from './callbacks'

export const STATIC_ZZ_UI_TAG_CALLBACK_MAP: Partial<Record<ZZ_UI_TAG, (nodeInfo: Draft<NodeInfo>) => void>> = {
  [ZZ_UI_TAG.FIXED_TOP_CONTAINER]: zzFixedTopContainerCallback,
  [ZZ_UI_TAG.ICON]: zzIconCallback,
  [ZZ_UI_TAG.DIVIDER]: zzDividerCallback,
  [ZZ_UI_TAG.NOTICE_BAR]: zzNoticeBarCallback,
  [ZZ_UI_TAG.SWIPE_INDICATOR]: swipeIndicatorCallback,
}
