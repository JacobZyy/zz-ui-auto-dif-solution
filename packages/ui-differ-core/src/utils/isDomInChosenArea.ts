import { domConfigs } from '../stores'

export function isDomInChosenArea(domNode: HTMLElement) {
  const areaBoundingRect = domConfigs.getRootBounding()
  if (!areaBoundingRect) {
    return true
  }

  const domBoundingRect = domNode.getBoundingClientRect()
  console.log('🚀 ~ isDomInChosenArea ~ domBoundingRect:', domBoundingRect)

  return false
}
