import type { CSSModifier } from './css-modifier'
import { sleep } from '@ui-differ/core'
import { fetchCSSContent, fetchMultipleCSSContents } from './css-fetcher'
import { injectCSS } from './css-injector'
import { defaultCSSModifier } from './css-modifier'
import { getExternalStyleSheetURLs } from './dom-parser'
/**
 * CSS Hacker 主流程
 */
export async function hackCSS(modifier: CSSModifier = defaultCSSModifier): Promise<void> {
  console.log('[CSS Hacker] 开始解析页面样式...')

  const externalUrls = getExternalStyleSheetURLs()
  console.log('[CSS Hacker] 发现外部样式表:', externalUrls)

  if (externalUrls.length === 0) {
    console.log('[CSS Hacker] 没有外部样式表需要处理')
    return
  }

  console.log('[CSS Hacker] 开始获取外部CSS内容...')
  const cssContents = await fetchMultipleCSSContents(externalUrls)

  console.log('[CSS Hacker] 开始处理和注入CSS...')
  for (const [url, originalContent] of cssContents) {
    if (!originalContent) {
      console.warn(`[CSS Hacker] 跳过空内容: ${url}`)
      continue
    }

    const modifiedContent = await modifier(originalContent)

    injectCSS(modifiedContent, url)
    console.log(`[CSS Hacker] 已注入: ${url}`)
  }

  console.log('[CSS Hacker] 完成')
  await sleep(500)
}
/**
 * Hack单个CSS文件
 */
export async function hackSingleCSS(
  url: string,
  modifier: CSSModifier = defaultCSSModifier,
): Promise<void> {
  console.log(`[CSS Hacker] 获取CSS: ${url}`)

  const originalContent = await fetchCSSContent(url)
  const modifiedContent = await modifier(originalContent)

  injectCSS(modifiedContent, url)
  console.log(`[CSS Hacker] 已注入: ${url}`)
}
