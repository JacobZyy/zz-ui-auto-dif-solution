import { floorOrderTraversalWithDom, getPxValue } from '../utils'

function judgeIsPriceContainer(domNode: HTMLElement) {
  const processedChildNodeLits = Array.from(domNode.children).map((node) => {
    if (node.getAttribute('data-text-wrapper') === '1') {
      // 文本节点 返回文本
      return node.textContent
    }
    // 非文本节点
    if (node.children.length !== 1) {
      // 节点内部有多个element。返回特殊标识符
      return 'NOT_FIT'
    }
    // 内部只有一个节点
    const grandChildNode = node.children[0]
    if (grandChildNode.getAttribute('data-text-wrapper') === '1') {
      // 文本节点  返回内容
      return grandChildNode.textContent
    }
    // 内部不是文本节点。返回notFit
    return 'NOT_FIT'
  })

  const hasNotFit = processedChildNodeLits.includes('NOT_FIT')
  if (hasNotFit) {
    return false
  }
  const content = processedChildNodeLits.join('')

  // 判断字符串是否符合 xxx￥[number]xxx这种格式
  const pricePattern = /￥\d+(?:\.\d+)?/
  return pricePattern.test(content)
}

/**
 * 判断当前节点是否是价格的容器
 * @description 这一步骤已经获取过
 */
export function processPriceContainer(rootDom: HTMLElement) {
  const floorOrderDomList = Array.from(floorOrderTraversalWithDom(rootDom))
  const reversedFloorOrderDomList = floorOrderDomList.toReversed()
  reversedFloorOrderDomList.forEach((domNode) => {
    const isDataTextWrapper = domNode.getAttribute('data-text-wrapper')
    if (isDataTextWrapper) {
      return
    }
    const isPriceContainer = judgeIsPriceContainer(domNode as HTMLElement)
    if (!isPriceContainer) {
      return
    }
    const isConstractedHeight = domNode.getAttribute('data-constracted-height') === '1'
    if (isConstractedHeight) {
      return
    }
    const childMaxLineHeight = Array.from(domNode.children).map((node) => {
      const style = window.getComputedStyle(node as HTMLElement)
      return getPxValue(style.lineHeight)
    })
    const maxHeight = Math.max(...childMaxLineHeight)
    if (!maxHeight) {
      return
    }

    (domNode as HTMLElement).style.height = `${maxHeight}px`
    domNode.setAttribute('data-constracted-height', '1')
  })
}
