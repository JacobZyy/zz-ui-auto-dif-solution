import { floorOrderTraversalWithDom, processPxInValue, processRemInValue } from '../utils'

function transformInlineStyleValue(value: string) {
  if (!value)
    return
  if (value.includes('px')) {
    return processPxInValue(value)
  }

  if (value.includes('rem')) {
    return processRemInValue(value, 37.5)
  }

  return value
}

/**
 * 处理DOM节点的inline style，将rem转换为px
 */
export function processDomInlineStyle(rootDom: HTMLElement): void {
  const floorOrderDomList = Array.from(floorOrderTraversalWithDom(rootDom))

  floorOrderDomList.forEach((domNode) => {
    if (!(domNode instanceof HTMLElement)) {
      return
    }

    const inlineStyle = domNode.getAttribute('style')
    if (!inlineStyle || (!inlineStyle.includes('rem') && !inlineStyle.includes('px'))) {
      return
    }

    // 解析inline style
    const styleDeclarations = inlineStyle.split(';').filter(Boolean)

    const processedStyles = styleDeclarations.map((declaration) => {
      const [property, value] = declaration.split(':').map(s => s.trim())
      return `${property}: ${transformInlineStyleValue(value)}`
    })

    domNode.setAttribute('style', processedStyles.join('; '))
  })
}
