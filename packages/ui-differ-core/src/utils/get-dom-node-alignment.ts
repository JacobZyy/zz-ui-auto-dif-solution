import { AlignmentPosition } from '../types/enums'

/**
 * 检测水平居右的CSS场景
 */
function detectHorizontalRight(element: HTMLElement, parentComputedStyle: CSSStyleDeclaration): boolean {
  const computedStyle = window.getComputedStyle(element)

  // 1. float: right
  if (computedStyle.float === 'right') {
    return true
  }

  // 2. position: absolute/fixed 且 right存在而left不存在或为auto
  const position = computedStyle.position
  if (position === 'absolute' || position === 'fixed') {
    const right = computedStyle.right
    const left = computedStyle.left
    if (right !== 'auto' && (left === 'auto' || !left)) {
      return true
    }
  }

  // 3. margin-left: auto (但margin-right不是auto)
  const marginLeft = computedStyle.marginLeft
  const marginRight = computedStyle.marginRight
  const display = computedStyle.display
  if (marginLeft === 'auto' && marginRight !== 'auto' && display === 'block') {
    return true
  }

  // 4. 父元素是flex容器
  if (parentComputedStyle.display === 'flex' || parentComputedStyle.display === 'inline-flex') {
    // flex子项的margin-left: auto
    if (marginLeft === 'auto' && marginRight !== 'auto') {
      return true
    }

    // 父容器justify-content: flex-end
    const justifyContent = parentComputedStyle.justifyContent
    if (justifyContent === 'flex-end') {
      return true
    }
  }

  // 5. 父元素是grid容器
  if (parentComputedStyle.display === 'grid' || parentComputedStyle.display === 'inline-grid') {
    const justifySelf = computedStyle.justifySelf
    const justifyItems = parentComputedStyle.justifyItems
    if (justifySelf === 'end' || (justifySelf === 'auto' && justifyItems === 'end')) {
      return true
    }
  }

  // 6. text-align: right (针对inline/inline-block元素)
  if (display === 'inline' || display === 'inline-block') {
    if (parentComputedStyle.textAlign === 'right') {
      return true
    }
  }

  return false
}

/**
 * 检测水平居中的CSS场景
 */
function detectHorizontalCenter(element: HTMLElement, parentComputedStyle: CSSStyleDeclaration): boolean {
  const computedStyle = window.getComputedStyle(element)

  // 1. margin: 0 auto (block元素)
  const marginLeft = computedStyle.marginLeft
  const marginRight = computedStyle.marginRight
  const display = computedStyle.display
  if (marginLeft === 'auto' && marginRight === 'auto' && display === 'block') {
    return true
  }

  // 2. position: absolute/fixed 且使用 left: 50% + transform
  const position = computedStyle.position
  if (position === 'absolute' || position === 'fixed') {
    const left = computedStyle.left
    const transform = computedStyle.transform
    if (left === '50%' || (transform && transform.includes('translateX'))) {
      return true
    }
  }

  // 3. 父元素是flex容器
  if (parentComputedStyle.display === 'flex' || parentComputedStyle.display === 'inline-flex') {
    // flex子项的margin: 0 auto
    if (marginLeft === 'auto' && marginRight === 'auto') {
      return true
    }

    // 父容器justify-content: center
    const justifyContent = parentComputedStyle.justifyContent
    if (justifyContent === 'center') {
      return true
    }
  }

  // 4. 父元素是grid容器
  if (parentComputedStyle.display === 'grid' || parentComputedStyle.display === 'inline-grid') {
    const justifySelf = computedStyle.justifySelf
    const justifyItems = parentComputedStyle.justifyItems
    if (justifySelf === 'center' || (justifySelf === 'auto' && justifyItems === 'center')) {
      return true
    }
  }

  // 5. text-align: center (针对inline/inline-block元素)
  if (display === 'inline' || display === 'inline-block') {
    if (parentComputedStyle.textAlign === 'center') {
      return true
    }
  }

  return false
}

/**
 * 检测垂直居下的CSS场景
 */
function detectVerticalBottom(element: HTMLElement, parentComputedStyle: CSSStyleDeclaration): boolean {
  const computedStyle = window.getComputedStyle(element)

  // 1. position: absolute/fixed 且 bottom存在而top不存在或为auto
  const position = computedStyle.position
  if (position === 'absolute' || position === 'fixed') {
    const bottom = computedStyle.bottom
    const top = computedStyle.top
    if (bottom !== 'auto' && (top === 'auto' || !top)) {
      return true
    }
  }

  // 2. margin-top: auto (在flex容器中)
  const marginTop = computedStyle.marginTop
  const marginBottom = computedStyle.marginBottom
  if (parentComputedStyle.display === 'flex' || parentComputedStyle.display === 'inline-flex') {
    // flex子项的margin-top: auto
    if (marginTop === 'auto' && marginBottom !== 'auto') {
      return true
    }

    // 父容器align-items: flex-end
    const alignItems = parentComputedStyle.alignItems
    if (alignItems === 'flex-end') {
      return true
    }

    // 子项自身的align-self: flex-end
    const alignSelf = computedStyle.alignSelf
    if (alignSelf === 'flex-end') {
      return true
    }
  }

  // 3. 父元素是grid容器
  if (parentComputedStyle.display === 'grid' || parentComputedStyle.display === 'inline-grid') {
    const alignSelf = computedStyle.alignSelf
    const alignItems = parentComputedStyle.alignItems
    if (alignSelf === 'end' || (alignSelf === 'auto' && alignItems === 'end')) {
      return true
    }
  }

  // 4. vertical-align: bottom (在table-cell或inline-block中)
  const display = computedStyle.display
  const verticalAlign = computedStyle.verticalAlign
  if ((display === 'table-cell' || display === 'inline-block') && verticalAlign === 'bottom') {
    return true
  }

  return false
}

/**
 * 检测垂直居中的CSS场景
 */
function detectVerticalMiddle(element: HTMLElement, parentComputedStyle: CSSStyleDeclaration): boolean {
  const computedStyle = window.getComputedStyle(element)

  // 1. margin: auto 0 (在flex容器中)
  const marginTop = computedStyle.marginTop
  const marginBottom = computedStyle.marginBottom
  if (parentComputedStyle.display === 'flex' || parentComputedStyle.display === 'inline-flex') {
    // flex子项的margin: auto 0
    if (marginTop === 'auto' && marginBottom === 'auto') {
      return true
    }

    // 父容器align-items: center
    const alignItems = parentComputedStyle.alignItems
    if (alignItems === 'center') {
      return true
    }

    // 子项自身的align-self: center
    const alignSelf = computedStyle.alignSelf
    if (alignSelf === 'center') {
      return true
    }
  }

  // 2. position: absolute/fixed 且使用 top: 50% + transform
  const position = computedStyle.position
  if (position === 'absolute' || position === 'fixed') {
    const top = computedStyle.top
    const transform = computedStyle.transform
    if (top === '50%' || (transform && transform.includes('translateY'))) {
      return true
    }
  }

  // 3. 父元素是grid容器
  if (parentComputedStyle.display === 'grid' || parentComputedStyle.display === 'inline-grid') {
    const alignSelf = computedStyle.alignSelf
    const alignItems = parentComputedStyle.alignItems
    if (alignSelf === 'center' || (alignSelf === 'auto' && alignItems === 'center')) {
      return true
    }
  }

  // 4. vertical-align: middle (在table-cell或inline-block中)
  const display = computedStyle.display
  const verticalAlign = computedStyle.verticalAlign
  if ((display === 'table-cell' || display === 'inline-block') && verticalAlign === 'middle') {
    return true
  }

  return false
}

/**
 * 对齐位置映射表
 */
const ALIGNMENT_MAP: Record<string, AlignmentPosition> = {
  'left-top': AlignmentPosition.LEFT_TOP,
  'left-middle': AlignmentPosition.LEFT_MIDDLE,
  'left-bottom': AlignmentPosition.LEFT_BOTTOM,
  'center-top': AlignmentPosition.CENTER_TOP,
  'center-middle': AlignmentPosition.CENTER_MIDDLE,
  'center-bottom': AlignmentPosition.CENTER_BOTTOM,
  'right-top': AlignmentPosition.RIGHT_TOP,
  'right-middle': AlignmentPosition.RIGHT_MIDDLE,
  'right-bottom': AlignmentPosition.RIGHT_BOTTOM,
}

/**
 * 获取水平对齐方式
 */
function getHorizontalAlignment(element: HTMLElement, parentComputedStyle: CSSStyleDeclaration): 'left' | 'center' | 'right' {
  if (detectHorizontalCenter(element, parentComputedStyle))
    return 'center'
  if (detectHorizontalRight(element, parentComputedStyle))
    return 'right'
  return 'left'
}

/**
 * 获取垂直对齐方式
 */
function getVerticalAlignment(element: HTMLElement, parentComputedStyle: CSSStyleDeclaration): 'top' | 'middle' | 'bottom' {
  if (detectVerticalMiddle(element, parentComputedStyle))
    return 'middle'
  if (detectVerticalBottom(element, parentComputedStyle))
    return 'bottom'
  return 'top'
}

/**
 * 判断节点在父节点中的对齐位置(基于CSS属性)
 * @param node 当前节点
 * @param flatNodeMap 节点映射表
 * @returns 对齐位置枚举
 */
export function getDomNodeAlignment(domNode: HTMLElement): AlignmentPosition {
  const parentElement = domNode.parentElement
  if (!parentElement)
    return AlignmentPosition.LEFT_TOP

  const parentComputedStyle = window.getComputedStyle(parentElement)
  const horizontal = getHorizontalAlignment(domNode, parentComputedStyle)
  const vertical = getVerticalAlignment(domNode, parentComputedStyle)

  return ALIGNMENT_MAP[`${horizontal}-${vertical}`]
}
