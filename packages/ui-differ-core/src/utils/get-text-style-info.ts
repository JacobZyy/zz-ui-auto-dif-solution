import type { TextStyleInfo } from '../types'
import { capitalize } from 'radash'
import { TextAlignmentDesignConvertMap } from '../types'
import { getTextAlignment } from './get-text-alignment'

function getDomNodeTextContent(domNode: Element): string {
  if (domNode.tagName === 'INPUT') {
    const reTypedNode = domNode as HTMLInputElement
    return reTypedNode.value || reTypedNode.placeholder || 'noData'
  }
  return domNode.textContent?.trim() || ''
}

export function getDomTextStyleInfo(domNode: Element): TextStyleInfo | undefined {
  // 检查节点是否包含子元素（非纯文本）
  if (domNode.children.length > 0) {
    return undefined
  }

  const textContent = getDomNodeTextContent(domNode)

  if (!textContent) {
    return undefined
  }

  // 创建临时测量元素
  const measureElement = document.createElement('div')
  const computedStyle = window.getComputedStyle(domNode)

  // 复制关键样式到测量元素
  measureElement.style.position = 'absolute'
  measureElement.style.visibility = 'hidden'
  measureElement.style.whiteSpace = computedStyle.whiteSpace
  measureElement.style.wordBreak = computedStyle.wordBreak
  measureElement.style.wordWrap = computedStyle.wordWrap
  measureElement.style.fontSize = computedStyle.fontSize
  measureElement.style.fontFamily = computedStyle.fontFamily
  measureElement.style.fontWeight = computedStyle.fontWeight
  measureElement.style.lineHeight = computedStyle.lineHeight
  measureElement.style.overflow = computedStyle.overflow
  measureElement.style.textTransform = computedStyle.textTransform
  measureElement.style.textDecoration = computedStyle.textDecoration
  measureElement.style.width = `${domNode.getBoundingClientRect().width}px`
  measureElement.style.textOverflow = computedStyle.textOverflow

  measureElement.style.padding = '0'
  measureElement.style.margin = '0'
  measureElement.style.border = 'none'

  // 设置文本内容
  measureElement.textContent = textContent || ''

  // 添加到DOM中进行测量
  document.body.appendChild(measureElement)

  const measureElementRect = measureElement.getBoundingClientRect()
  // 获取文本内容的实际高度
  const measureHeight = measureElementRect.height
  const measureWidth = measureElementRect.width
  const originHeight = Number(computedStyle.height.replace('px', ''))
  const isInline = computedStyle.display === 'inline'
  const shouldUseOriginHeight = !isInline && originHeight < measureHeight
  const textHeight = shouldUseOriginHeight ? originHeight : measureHeight

  // 移除临时元素
  document.body.removeChild(measureElement)

  // 获取行高数值
  const lineHeightValue: number = Number(computedStyle.lineHeight.replace('px', ''))

  const fontSizeValue = Number(computedStyle.fontSize.replace('px', ''))

  // 计算行数：文本高度除以行高
  const lineCount = Math.max(1, Math.round(textHeight / lineHeightValue))
  const baseTextStyle = {
    lineHeight: lineHeightValue,
    fontSize: fontSizeValue,
    textLineCount: lineCount,
    textWidth: measureWidth,
    textAlignment: getTextAlignment(domNode),
    textContent,
  }
  if (lineCount > 1) {
    return baseTextStyle
  }
  // 单行场景，重新计算宽度
  measureElement.style.width = 'auto'
  document.body.appendChild(measureElement)
  const measureElementRect2 = measureElement.getBoundingClientRect()
  document.body.removeChild(measureElement)
  return {
    ...baseTextStyle,
    textWidth: measureElementRect2.width,
  }
}

function getDesignNodeTextContent(sourceTextContent: string, textCase: TextCase) {
  if (textCase === 'LOWER') {
    return sourceTextContent.toLowerCase()
  }
  if (textCase === 'UPPER') {
    return sourceTextContent.toUpperCase()
  }
  if (textCase === 'TITLE') {
    return sourceTextContent.split(' ').map(capitalize).join(' ')
  }
  return sourceTextContent
}

export function getDesignNodeTextStyle(designNode: SceneNode): TextStyleInfo | undefined {
  if (designNode.type !== 'TEXT') {
    return undefined
  }

  const { textAutoResize, textStyles, textAlignHorizontal } = designNode
  // 行高四舍五入他的px值
  const lineHeightValue = Math.max(...textStyles.map(it => Math.round(it.textStyle.lineHeightByPx)))
  const fontSizeValue = Math.max(...textStyles.map(it => Math.round(it.textStyle.fontSize)))
  const textAlignment = TextAlignmentDesignConvertMap[textAlignHorizontal]

  // 字体处理方案
  const textTransform = textStyles[0].textStyle.textCase
  const textContent = getDesignNodeTextContent(designNode.characters, textTransform)

  if (textAutoResize === 'WIDTH_AND_HEIGHT' || textAutoResize === 'TRUNCATE') {
    // 单行模式
    return {
      lineHeight: lineHeightValue,
      fontSize: fontSizeValue,
      textLineCount: 1,
      textWidth: designNode.width,
      textAlignment,
      textContent,
      textAutoResize,
    }
  }

  if (textAutoResize === 'HEIGHT') {
    // 行数自适应，返回高度 / 行高的最小整数, 至少是1行

    // 文字宽度等于实际渲染宽度+2
    // const targetWidth = absoluteRenderBounds?.width ? absoluteRenderBounds.width + 2 : absoluteBoundingBox.width
    return {
      lineHeight: lineHeightValue,
      fontSize: fontSizeValue,
      textLineCount: Math.max(Math.floor(designNode.height / lineHeightValue), 1),
      textWidth: designNode.width,
      textAlignment,
      textContent,
      textAutoResize,
    }
  }

  const currentBoundingHeight = designNode.absoluteBoundingBox.height

  const realRenderHeight = designNode.absoluteRenderBounds?.height ?? currentBoundingHeight

  const deltaHeight = currentBoundingHeight - realRenderHeight

  if (deltaHeight < 0) {
    // TODO: 需要在插件侧限制处理
    console.error('实际高度小于当前高度，请联系ui')
  }

  if (deltaHeight > lineHeightValue) {
    // TODO: 需要在插件侧限制处理
    console.error('文本节点设置了过高的宽度，不符合标准，请联系UI修改设计图')
  }

  return {
    lineHeight: lineHeightValue,
    fontSize: fontSizeValue,
    // 实际渲染的高度肯定小于行高，所以向上取整 TODO: 需要处理文字高度小于整体高度的情况
    textLineCount: Math.max(Math.ceil(realRenderHeight / lineHeightValue), 1),
    textWidth: designNode.width,
    textAlignment,
    textContent,
    textAutoResize,
  }
}
