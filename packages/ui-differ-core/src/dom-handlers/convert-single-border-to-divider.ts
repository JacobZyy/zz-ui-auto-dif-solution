import type { BorderInfo, PaddingInfo } from '../types'
import { camel } from 'radash'
import { changeElementStyle, getDomBackgroundColor, getDomBorderInfo, getDomPaddingInfo, getPxValue } from '../utils'

const directionOppsiteRelationMap: Record<string, string> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const borderDirectionToSizeKeyMap: Record<string, { fitNode: 'width' | 'height', fitBorder: 'width' | 'height' }> = {
  top: { fitNode: 'width', fitBorder: 'height' },
  bottom: { fitNode: 'width', fitBorder: 'height' },
  left: { fitNode: 'height', fitBorder: 'width' },
  right: { fitNode: 'height', fitBorder: 'width' },
}

function appendDividerNode(currentDom: HTMLElement, borderInfo: BorderInfo) {
  const borderInfoList = Object.entries(borderInfo || {})
    .filter(([_, it]) => it.width !== 0 && it.color !== 'transparent')
    .map(([key, border]) => ({
      ...border,
      key,
      direction: key.replace('border', '').toLocaleLowerCase(),
    }))

  if (borderInfoList.length !== 1) {
    return
  }
  const {
    color: targetBorderColor,
    width: targetBorderWidth,
    from: borderFrom,
    direction,
  } = borderInfoList[0]
  const computedStyle = window.getComputedStyle(currentDom)
  const paddingInfo = getDomPaddingInfo(currentDom)
  const marginInfo = {
    marginLeft: getPxValue(computedStyle.marginLeft),
    marginRight: getPxValue(computedStyle.marginRight),
    marginTop: getPxValue(computedStyle.marginTop),
    marginBottom: getPxValue(computedStyle.marginBottom),
  } as const
  const targetMarginKey = camel(`margin ${direction}`) as keyof typeof marginInfo
  const targetPaddingKey = camel(`padding ${direction}`) as keyof PaddingInfo
  const targetDirectionMargin = marginInfo[targetMarginKey]
  const targetDirectionPadding = paddingInfo[targetPaddingKey]

  // 修改当前dom的样式
  changeElementStyle({
    element: currentDom,
    styleContent: `
      border-${direction}: none !important;
    `,
    pseudoType: borderFrom === 'normal' ? undefined : borderFrom,
  })
  changeElementStyle({
    element: currentDom,
    styleContent: `
      margin-${direction}: 0 !important;
      padding-${direction}: 0 !important;
    `,
  })

  // 相反方向的key
  const oppsiteDirection = directionOppsiteRelationMap[direction]
  // 创建divider的dom节点
  const dividerNode = document.createElement('div')

  dividerNode.style.backgroundColor = targetBorderColor

  const { fitNode, fitBorder } = borderDirectionToSizeKeyMap[direction]
  // 设置节点的宽高
  dividerNode.style[fitNode] = computedStyle[fitNode]
  dividerNode.style[fitBorder] = `${targetBorderWidth}px`
  dividerNode.style.display = 'inline-block'
  dividerNode.style.transformOrigin = 'center center'
  if (targetBorderWidth === 1) {
    dividerNode.style.transform = 'scale(0.5)'
  }
  // 与direction相同一侧的margin，用targetMargin，另一侧用targetPadding
  dividerNode.style[targetMarginKey] = `${targetDirectionMargin}px`
  const oppsiteMarginKey = camel(`margin ${oppsiteDirection}`) as keyof typeof marginInfo
  dividerNode.style[oppsiteMarginKey] = `${targetDirectionPadding}px`

  if (direction === 'left' || direction === 'right') {
    // 纵向的divider，则将父节点纵向的margin和paddding塞进去
    dividerNode.style.marginTop = `${marginInfo.marginTop}px`
    dividerNode.style.marginBottom = `${marginInfo.marginBottom}px`
    dividerNode.style.paddingTop = `${paddingInfo.paddingTop}px`
    dividerNode.style.paddingBottom = `${paddingInfo.paddingBottom}px`
  }

  if (direction === 'top' || direction === 'bottom') {
    // 横向的divider，则将父节点横向的margin和paddding塞进去
    dividerNode.style.marginLeft = `${marginInfo.marginLeft}px`
    dividerNode.style.marginRight = `${marginInfo.marginRight}px`
    dividerNode.style.paddingLeft = `${paddingInfo.paddingLeft}px`
    dividerNode.style.paddingRight = `${paddingInfo.paddingRight}px`
  }

  const parentNode = currentDom.parentElement
  if (!parentNode) {
    return
  }
  // left或top时插入到当前节点前面，right或bottom时插入到当前节点后面
  if (direction === 'left' || direction === 'top') {
    parentNode.insertBefore(dividerNode, currentDom)
  }
  else if (currentDom.nextSibling) {
    parentNode.insertBefore(dividerNode, currentDom.nextSibling)
  }
  else {
    parentNode.appendChild(dividerNode)
  }
}

/**
 * 判断是否是divider(添加了边框)
 * @param currentDom 当前dom
 * @param borderInfo 边框信息
 * @returns
 */
function getIsDividerNodeByBorder(currentDom: HTMLElement, borderInfo: BorderInfo) {
  const boundingRect = currentDom.getBoundingClientRect()
  const borderInfoList = Object.entries(borderInfo || {})
    .filter(([_, it]) => it.width !== 0 && it.color !== 'transparent')
    .map(([key, border]) => ({
      ...border,
      key,
      direction: key.replace('border', '').toLocaleLowerCase(),
    }))

  if (borderInfoList.length !== 1) {
    return false
  }

  const { direction } = borderInfoList[0]

  const { fitBorder } = borderDirectionToSizeKeyMap[direction]

  const originDomTargetValue = boundingRect[fitBorder]

  return originDomTargetValue <= 1
}

/**
 * 判断是否是divider(靠1px宽高+背景色形成的)
 * @param currentDom 当前dom
 * @returns
 */
function getIsDividerBySize(currentDom: HTMLElement) {
  const boundingRect = currentDom.getBoundingClientRect()
  const isLine = (boundingRect.width <= 1 || boundingRect.height <= 1) && !!boundingRect.width && !!boundingRect.height
  if (!isLine) {
    return false
  }
  const backgroundColor = getDomBackgroundColor(currentDom)
  return backgroundColor !== 'transparent'
}

/**
 * 将靠1px宽高+背景色形成的divider转换为border divider
 * @param currentDom 当前dom
 */
function convertBgDividerToBorderDivider(currentDom: HTMLElement) {
  const backgroundColor = getDomBackgroundColor(currentDom)
  const borderStyle = `
    border: 1px solid ${backgroundColor};
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 200%;
    z-index: 99;
    transform-origin: left top;
    transform: scale(0.5);
  `
  changeElementStyle({
    element: currentDom,
    styleContent: `
      background-color: transparent !important;
      position: relative !important;
    `,
  })
  changeElementStyle({
    element: currentDom,
    styleContent: borderStyle,
    pseudoType: 'after',
  })
}

export function convertSingleBorderToDivider(rootDom: HTMLElement): void {
  const borderInfo = getDomBorderInfo(rootDom)

  // 判断是否本身就是divider
  const isAlreadyDivider = getIsDividerNodeByBorder(rootDom, borderInfo)
  // 如果是，直接返回
  if (isAlreadyDivider) {
    return
  }

  const isDividerBySize = getIsDividerBySize(rootDom)
  // 靠1px宽高+背景色形成的divider
  if (isDividerBySize) {
    return convertBgDividerToBorderDivider(rootDom)
  }

  // 如果不是，转换
  appendDividerNode(rootDom, borderInfo)

  const childrenLen = rootDom.children.length
  if (!childrenLen) {
    return
  }
  Array.from(rootDom.children).forEach((childNode) => {
    const childDom = childNode as HTMLElement
    convertSingleBorderToDivider(childDom)
  })
}
