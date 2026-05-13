export enum ZZ_UI_TAG {
  // 顶吸导航容器
  FIXED_TOP_CONTAINER = 'fixed-top-container',
  // 图标
  ICON = 'z-icon',
  // divider
  DIVIDER = 'z-divider',
  // z-nav-bar
  NAV_BAR = 'z-nav-bar',
  // z-tab-bar-right
  TAB_BAR_RIGHT = 'z-nav-bar__right',
  // z-tab-bar-left
  TAB_BAR_LEFT = 'z-nav-bar__left',
  // z-tab-bar-title
  TAB_BAR_TITLE = 'z-nav-bar__title',
  // button
  BUTTON = 'z-button',
  // buttonGroup
  BUTTON_GROUP = 'z-button-group',
  /** 通告兰 */
  NOTICE_BAR = 'z-notice-bar',
  /** divider指示器 */
  SWIPE_INDICATOR = 'z-swipe__indicator',
}

export const zzUiTagSet: Set<string> = new Set([
  ZZ_UI_TAG.ICON,
  ZZ_UI_TAG.DIVIDER,
  ZZ_UI_TAG.NAV_BAR,
  ZZ_UI_TAG.TAB_BAR_RIGHT,
  ZZ_UI_TAG.TAB_BAR_LEFT,
  ZZ_UI_TAG.TAB_BAR_TITLE,
  ZZ_UI_TAG.BUTTON,
  ZZ_UI_TAG.BUTTON_GROUP,
  ZZ_UI_TAG.NOTICE_BAR,
  ZZ_UI_TAG.SWIPE_INDICATOR,
])
