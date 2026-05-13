import { getDomNodeByUniqueId } from './get-dom-node-by-unique-id'

export function debuggerHandler(currentId: string, targetCls: string) {
  const currentEl = getDomNodeByUniqueId(currentId)
  console.log('🚀 ~ debuggerHandler ~ currentEl:', currentEl)
  if (!currentEl) {
    return
  }

  if (!currentEl.classList.contains(targetCls)) {
    return
  }
  const elementList = document.querySelectorAll(`.${targetCls}`)
  const elementArray = Array.from(elementList)
  const targetIdx = elementArray.findIndex(el => el === currentEl)
  if (!targetIdx) {
    // eslint-disable-next-line no-debugger
    debugger
  }
}

export function isTargetNode(currentId: string, targetCls: string) {
  const currentEl = getDomNodeByUniqueId(currentId)
  if (!currentEl) {
    return false
  }

  if (!currentEl.classList.contains(targetCls)) {
    return false
  }
  const elementList = document.querySelectorAll(`.${targetCls}`)
  const elementArray = Array.from(elementList)
  const targetIdx = elementArray.findIndex(el => el === currentEl)
  return targetIdx !== -1
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
