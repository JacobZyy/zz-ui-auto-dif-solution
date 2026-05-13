import { getPxConvertMap } from '../utils'
import { convertDesignToPx } from './design-px-value-converter'

/** 抹平前端px2rem方案导致的精度问题 */
export function convertRealPxValue(originPx: number) {
  if (originPx === 1) {
    return originPx
  }

  const pxConvertMap = getPxConvertMap()

  // 转换成设计稿的值（静态hashMap映射）
  const mappedDesignValue = pxConvertMap.get(originPx)

  if (!mappedDesignValue) {
    return Math.ceil(originPx * 10) / 10
  }

  // 走设计稿的转换逻辑
  return convertDesignToPx(mappedDesignValue)
}

const remRegex = /(\d+(?:\.\d+)?|\.\d+)rem/gi
const pxRegex = /(\d+(?:\.\d+)?|\.\d+)px/gi

/**
 * 处理CSS属性值中的rem单位，转换为px
 */
export function processRemInValue(value: string, baseFontSize: number): string {
  if (!value || !value.includes('rem')) {
    return value
  }

  const convertMap = getPxConvertMap()

  return value.replace(remRegex, (_match, remValue) => {
    const convertedRemValue = Number(remValue)
    const convertedPxValue = Math.round(convertedRemValue * baseFontSize * 10000) / 10000
    const designValue = convertMap.get(convertedPxValue)

    if (!designValue) {
      return `${convertedRemValue}rem`
    }
    return `${convertDesignToPx(designValue)}px`
  })
}

/**
 * 处理CSS属性值中精度丢失的px，转换为原精度的px
 */
export function processPxInValue(value: string): string {
  if (!value || !value.includes('px')) {
    return value
  }

  const convertMap = getPxConvertMap()

  return value.replace(pxRegex, (_match, remValue) => {
    const convertedPxValue = Number(remValue)
    const designValue = convertMap.get(convertedPxValue)

    if (!designValue) {
      return `${convertedPxValue}px`
    }
    return `${convertDesignToPx(designValue)}px`
  })
}
