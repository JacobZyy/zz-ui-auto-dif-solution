export interface InjectedHeightRuleMatch {
  sourceUrl: string
  injectedAt: string | null
  selectorText: string
  cssText: string
  height: string | null
  minHeight: string | null
  maxHeight: string | null
}
export interface ElementHeightConstraintAnalysis {
  /** 是否存在内联样式约束 */
  hasInlineConstraint: boolean
  /** 是否存在注入样式约束 */
  hasInjectedRuleConstraint: boolean
  /** 是否存在高度约束 */
  isHeightConstrained: boolean
  matches: InjectedHeightRuleMatch[]
}
function hasInlineHeightConstraint(element: HTMLElement): boolean {
  const style = element.style

  const height = style.height.trim()
  const minHeight = style.minHeight.trim()
  const maxHeight = style.maxHeight.trim()

  const hasHeight = normalizeMainSizeValue(height) !== null
  const hasMinHeight = normalizeMinSizeValue(minHeight) !== null
  const hasMaxHeight = normalizeMaxSizeValue(maxHeight) !== null

  return hasHeight || hasMinHeight || hasMaxHeight
}
function normalizeMainSizeValue(value: string | null): string | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed || trimmed === 'auto') {
    return null
  }

  return trimmed
}
function normalizeMinSizeValue(value: string | null): string | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed || trimmed === '0' || trimmed === '0px') {
    return null
  }

  return trimmed
}
function normalizeMaxSizeValue(value: string | null): string | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed || trimmed === 'none') {
    return null
  }

  return trimmed
}
function collectMatchesFromRuleList(
  rules: CSSRuleList,
  styleElement: HTMLStyleElement,
  element: HTMLElement,
): InjectedHeightRuleMatch[] {
  return Array.from(rules).flatMap((rule) => {
    if (rule instanceof CSSStyleRule) {
      if (!element.matches(rule.selectorText)) {
        return []
      }

      const style = rule.style

      const rawHeight = style.getPropertyValue('height') || null
      const rawMinHeight = style.getPropertyValue('min-height') || null
      const rawMaxHeight = style.getPropertyValue('max-height') || null

      const height = normalizeMainSizeValue(rawHeight)
      const minHeight = normalizeMinSizeValue(rawMinHeight)
      const maxHeight = normalizeMaxSizeValue(rawMaxHeight)

      if (!height && !minHeight && !maxHeight) {
        return []
      }

      const sourceUrl = styleElement.getAttribute('data-injected-from') || ''
      const injectedAt = styleElement.getAttribute('data-injected-at')

      const match: InjectedHeightRuleMatch = {
        sourceUrl,
        injectedAt,
        selectorText: rule.selectorText,
        cssText: rule.cssText,
        height,
        minHeight,
        maxHeight,
      }

      return [match]
    }

    if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
      return collectMatchesFromRuleList(rule.cssRules, styleElement, element)
    }

    return []
  })
}
function getElementHeightConstraintAnalysis(
  element: HTMLElement,
): ElementHeightConstraintAnalysis {
  const hasInlineConstraint = hasInlineHeightConstraint(element)

  const styleElements = document.querySelectorAll<HTMLStyleElement>(
    'style[data-injected-from]',
  )

  const matches = Array.from(styleElements).flatMap((styleElement) => {
    const sheet = styleElement.sheet

    if (!sheet) {
      return []
    }

    const cssSheet = sheet instanceof CSSStyleSheet ? sheet : null

    if (!cssSheet) {
      return []
    }

    return collectMatchesFromRuleList(cssSheet.cssRules, styleElement, element)
  })

  const hasInjectedRuleConstraint = matches.length > 0

  return {
    hasInlineConstraint,
    hasInjectedRuleConstraint,
    isHeightConstrained: hasInlineConstraint || hasInjectedRuleConstraint,
    matches,
  }
}
export function analyzeElementHeightFromInjectedStyles(element: HTMLElement): boolean {
  const analysis = getElementHeightConstraintAnalysis(element)

  return analysis.isHeightConstrained
}
function hasInlineWidthConstraint(element: HTMLElement): boolean {
  const style = element.style

  const width = style.width.trim()
  const minWidth = style.minWidth.trim()
  const maxWidth = style.maxWidth.trim()

  const hasWidth = normalizeMainSizeValue(width) !== null
  const hasMinWidth = normalizeMinSizeValue(minWidth) !== null
  const hasMaxWidth = normalizeMaxSizeValue(maxWidth) !== null

  return hasWidth || hasMinWidth || hasMaxWidth
}
function hasWidthConstraintInRuleList(
  rules: CSSRuleList,
  element: HTMLElement,
): boolean {
  return Array.from(rules).some((rule) => {
    if (rule instanceof CSSStyleRule) {
      if (!element.matches(rule.selectorText)) {
        return false
      }

      const style = rule.style

      const rawWidth = style.getPropertyValue('width') || null
      const rawMinWidth = style.getPropertyValue('min-width') || null
      const rawMaxWidth = style.getPropertyValue('max-width') || null

      const width = normalizeMainSizeValue(rawWidth)
      const minWidth = normalizeMinSizeValue(rawMinWidth)
      const maxWidth = normalizeMaxSizeValue(rawMaxWidth)

      return Boolean(width || minWidth || maxWidth)
    }

    if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
      return hasWidthConstraintInRuleList(rule.cssRules, element)
    }

    return false
  })
}
function hasInjectedWidthConstraint(element: HTMLElement): boolean {
  const styleElements = document.querySelectorAll<HTMLStyleElement>(
    'style[data-injected-from]',
  )

  return Array.from(styleElements).some((styleElement) => {
    const sheet = styleElement.sheet

    if (!sheet || !(sheet instanceof CSSStyleSheet)) {
      return false
    }

    return hasWidthConstraintInRuleList(sheet.cssRules, element)
  })
}
export function analyzeElementWidthFromInjectedStyles(element: HTMLElement): boolean {
  const hasInlineConstraint = hasInlineWidthConstraint(element)

  if (hasInlineConstraint) {
    return true
  }

  return hasInjectedWidthConstraint(element)
}
export interface ElementSizeConstraintResult {
  isHeightConstrained: boolean
  isWidthConstrained: boolean
}
export function analyzeElementSizeFromStyleSheets(
  element: HTMLElement,
): ElementSizeConstraintResult {
  const isHeightConstrained = analyzeElementHeightFromInjectedStyles(element)
  const isWidthConstrained = analyzeElementWidthFromInjectedStyles(element)

  return {
    isHeightConstrained,
    isWidthConstrained,
  }
}
