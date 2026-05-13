export enum UnVisibleNodeTag {
  ALL = '1',
  PART = '2',
}

function findOverFlowHiddenParentNodeBounding(element: HTMLElement) {
  const parentElement = element.parentElement
  const currentStyle = window.getComputedStyle(element)
  if (currentStyle.position === 'fixed') {
    return null
  }

  const shouldConsiderRelative = currentStyle.position === 'absolute'

  if (!parentElement) {
    return null
  }
  if (parentElement.tagName === 'BODY') {
    return null
  }

  const computedStyle = window.getComputedStyle(parentElement)
  const isOverFlowHidden = computedStyle.overflow === 'hidden'
  const isRelative = computedStyle.position === 'relative'
  const isTargetElement = (!shouldConsiderRelative || isRelative) && isOverFlowHidden
  if (isTargetElement && parentElement.getAttribute('un-visible-node') !== UnVisibleNodeTag.PART) {
    return parentElement.getBoundingClientRect()
  }
  return findOverFlowHiddenParentNodeBounding(parentElement)
}

function onMarkNodeTag(element: HTMLElement) {
  const overFlowHiddenParentNodeBounding = findOverFlowHiddenParentNodeBounding(element)
  if (!overFlowHiddenParentNodeBounding) {
    return
  }
  const elementBounding = element.getBoundingClientRect()
  const isOverTop = elementBounding.top >= overFlowHiddenParentNodeBounding.bottom
  const isOverBottom = elementBounding.bottom <= overFlowHiddenParentNodeBounding.top
  const isOverLeft = elementBounding.right <= overFlowHiddenParentNodeBounding.left
  const isOverRight = elementBounding.left >= overFlowHiddenParentNodeBounding.right
  if (isOverTop || isOverBottom || isOverLeft || isOverRight) {
    element.setAttribute('un-visible-node', UnVisibleNodeTag.ALL)
    return
  }

  const isPartTop = elementBounding.top < overFlowHiddenParentNodeBounding.top
  const isPartBottom = elementBounding.bottom > overFlowHiddenParentNodeBounding.bottom
  const isPartLeft = elementBounding.left < overFlowHiddenParentNodeBounding.left
  const isPartRight = elementBounding.right > overFlowHiddenParentNodeBounding.right

  if (isPartTop || isPartBottom || isPartLeft || isPartRight) {
    element.setAttribute('un-visible-node', UnVisibleNodeTag.PART)
  }
}

export function markUnvisibleNodes(element: HTMLElement) {
  onMarkNodeTag(element)
  if (element.children.length) {
    Array.from(element.children).forEach(childNode => markUnvisibleNodes(childNode as HTMLElement))
  }
}
