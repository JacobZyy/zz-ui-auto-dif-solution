import postcss from 'postcss'
import convertPx2RemDeviation from './convert-px2rem-deviation'

/**
 * CSS修改器类型定义
 */
export type CSSModifier = (cssContent: string) => string | Promise<string>

const postcssProcessor = postcss([
  convertPx2RemDeviation(),
])

/**
 * 默认的CSS修改器（使用PostCSS处理）
 */
export const defaultCSSModifier: CSSModifier = async (cssContent: string) => {
  try {
    const result = await postcssProcessor.process(cssContent)
    return result.css
  }
  catch (error) {
    console.error('[CSS Modifier] PostCSS处理失败:', error)
    return cssContent
  }
}
/**
 * 创建组合修改器
 */
export function composeCSSModifiers(...modifiers: CSSModifier[]): CSSModifier {
  return async (cssContent: string) => {
    let result = cssContent

    for (const modifier of modifiers) {
      result = await modifier(result)
    }

    return result
  }
}
