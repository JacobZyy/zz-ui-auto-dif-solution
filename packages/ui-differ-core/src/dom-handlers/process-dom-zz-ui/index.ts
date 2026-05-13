import type { NodeInfo, UniqueId, ZZ_UI_TAG } from '../../types'
import { produce } from 'immer'
import { zzUiTagSet } from '../../types'
import { getDomNodeByUniqueId } from '../../utils'
import { STATIC_ZZ_UI_TAG_CALLBACK_MAP } from './static-zz-ui-tag-callback-map'

/** 添加zz-ui标签 */
function attachZZUIInfoTag(rootDom: HTMLElement) {
  const classArray = Array.from(rootDom.classList.values())
  // 找到在set里的zz-ui类名
  const targetTagText = classArray.find(tag => zzUiTagSet.has(tag))
  if (targetTagText) {
    // 如果有就打标
    rootDom.setAttribute('zz-ui-tag', targetTagText)
  }
}

/** 添加fixed-top-container标签 */
function attachFixedTopContainer(rootDom: HTMLElement) {
  if (rootDom.children.length !== 1) {
    return
  }

  const childNode = rootDom.children[0]
  if (childNode.classList.contains('z-fix-top')) {
    const childNodeHeight = childNode.getBoundingClientRect().height
    // fixed外层强行改成44px
    rootDom.style.height = `${childNodeHeight}px`
    rootDom.setAttribute('zz-ui-tag', 'fixed-top-container')
  }
}

export function preProcessZZUITag(rootDom: HTMLElement) {
  if (rootDom.children.length) {
    Array.from(rootDom.children).forEach((child) => {
      return preProcessZZUITag(child as HTMLElement)
    })
  }
  attachFixedTopContainer(rootDom)
  attachZZUIInfoTag(rootDom)
}

export function processDomZZUINode(flatNodeMap: Map<UniqueId, NodeInfo>) {
  const newFlatNodeMap = produce(flatNodeMap, (draftNodeMap) => {
    draftNodeMap.forEach((nodeInfo) => {
      const originElement = getDomNodeByUniqueId(nodeInfo.uniqueId)
      if (!originElement) {
        return
      }
      const zzUITag = originElement.getAttribute('zz-ui-tag') as ZZ_UI_TAG | null
      if (!zzUITag) {
        return
      }
      const callback = STATIC_ZZ_UI_TAG_CALLBACK_MAP[zzUITag]
      if (!callback) {
        return
      }

      callback(nodeInfo)
    })
  })

  return newFlatNodeMap
}
