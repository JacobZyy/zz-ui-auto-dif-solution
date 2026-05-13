import { analyzeElementSizeFromStyleSheets } from '../utils'

export function markIsSizeFromStyleSheet(domNode: HTMLElement) {
  if (domNode.children) {
    return Array.from(domNode.children).forEach(child => markIsSizeFromStyleSheet(child as HTMLElement))
  }

  const isInlineConstrained = (domNode.style.height && domNode.style.height !== 'auto') || (domNode.style.width && domNode.style.width !== 'auto')
  if (isInlineConstrained) {
    if (domNode.style.height) {
      domNode.setAttribute('height-constrained', '1')
    }
    if (domNode.style.width) {
      domNode.setAttribute('width-constrained', '1')
    }
    return
  }

  const { isHeightConstrained, isWidthConstrained } = analyzeElementSizeFromStyleSheets(domNode)

  if (isHeightConstrained) {
    domNode.setAttribute('height-constrained', '1')
  }
  if (isWidthConstrained) {
    domNode.setAttribute('width-constrained', '1')
  }
}
