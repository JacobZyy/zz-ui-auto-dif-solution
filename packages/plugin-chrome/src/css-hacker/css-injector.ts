/**
 * 注入CSS内容到页面
 */
export function injectCSS(cssContent: string, sourceUrl: string): HTMLStyleElement {
  const existingStyle = document.querySelector<HTMLStyleElement>(
    `style[data-injected-from="${sourceUrl}"]`,
  )

  if (existingStyle) {
    existingStyle.textContent = cssContent
    return existingStyle
  }

  const style = document.createElement('style')
  style.setAttribute('data-injected-from', sourceUrl)
  style.setAttribute('data-injected-at', new Date().toISOString())
  style.textContent = cssContent

  document.head.appendChild(style)

  const originalLink = document.querySelector<HTMLLinkElement>(
    `link[rel="stylesheet"][href="${sourceUrl}"]`,
  )
  if (originalLink) {
    originalLink.remove()
  }

  return style
}
/**
 * 移除指定来源的注入样式
 */
export function removeInjectedCSS(sourceUrl: string): boolean {
  const style = document.querySelector<HTMLStyleElement>(
    `style[data-injected-from="${sourceUrl}"]`,
  )

  if (style) {
    style.remove()
    return true
  }

  return false
}
/**
 * 移除所有注入的样式
 */
export function removeAllInjectedCSS(): number {
  const injectedStyles = document.querySelectorAll<HTMLStyleElement>(
    'style[data-injected-from]',
  )

  injectedStyles.forEach(style => style.remove())

  return injectedStyles.length
}
/**
 * 获取所有已注入的样式信息
 */
export function getInjectedCSSInfo(): Array<{
  sourceUrl: string
  injectedAt: string
  contentLength: number
}> {
  const injectedStyles = document.querySelectorAll<HTMLStyleElement>(
    'style[data-injected-from]',
  )

  return Array.from(injectedStyles).map(style => ({
    sourceUrl: style.getAttribute('data-injected-from') || '',
    injectedAt: style.getAttribute('data-injected-at') || '',
    contentLength: (style.textContent || '').length,
  }))
}
