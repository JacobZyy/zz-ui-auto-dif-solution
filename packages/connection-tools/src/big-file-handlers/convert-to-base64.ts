/**
 * 将图像数据转换为 Base64 数据 URL
 * @param data - 图像二进制数据
 * @returns 返回 base64 数据 URL
 */
export function convertToBase64(data: Uint8Array<ArrayBuffer>): Promise<string> {
  const blob = new Blob([data], { type: 'image/png' })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = function () {
      const result = reader.result as string
      if (result && result.length < 30) {
        resolve('')
        return
      }
      resolve(result || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
