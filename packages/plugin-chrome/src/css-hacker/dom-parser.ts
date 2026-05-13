/**
 * 获取所有外部样式表的URL列表
 */
export function getExternalStyleSheetURLs(): string[] {
  return Array.from(document.styleSheets)
    .map(sheet => sheet.href)
    .filter((href): href is string => href !== null)
}
