import { uploadPic } from '@ui-differ/connection-tools'
import { snapdom } from '@zumer/snapdom'
import { v4 } from 'uuid'

function hashCode(str: string) {
  let hash = 0
  if (!str || str.length === 0)
    return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash
}

export async function generateScreenShot() {
  const rootElement = (document.querySelector('#app') || document.querySelector('#root')) as HTMLElement
  const image = await snapdom.toBlob(rootElement, { type: 'png' })

  const file = new File([image], `${v4()}.png`, { type: image.type })

  const fileName = await uploadPic(file)
  if (!fileName) {
    return
  }

  const random = (Math.abs(hashCode(fileName)) % 6) + 1
  const modifiedFileName = fileName.replace('zhuanzh/', '')

  const resultUrl = `https://pic${random}.zhuanstatic.com/zhuanzh/${modifiedFileName}`
  console.log('🚀 ~ generateScreenShot ~ resultUrl:', resultUrl)

  return resultUrl
}
