import { designConfigs } from '../stores'

/** 设计稿默认宽度 */
const DESIGN_DEFAULT_WIDTH = 750
/** DOM的宽度 */
const DOM_DEFAULT_WIDTH = 37.5

export function convertDesignToPx(designPx: number) {
  if (Math.abs(designPx) <= 1) {
    return designPx
  }
  return designPx * DOM_DEFAULT_WIDTH / DESIGN_DEFAULT_WIDTH * 10
}

/**
 * 设计稿像素转换函数
 * @param designPx 设计稿像素值
 * @returns 转换后的像素值
 */
export function convertDesignPx(designPx: number): number {
  const convertPxTrigger = designConfigs.getConvertPxTrigger()
  if (!convertPxTrigger || Math.abs(designPx) <= 1) {
    return designPx
  }
  return convertDesignToPx(designPx)
}

/**
 * 转换X坐标
 * @param x 原始X坐标
 * @param rootOffsetX 根节点X偏移
 */
export function convertX(x: number, rootOffsetX: number): number {
  return convertDesignPx(x - rootOffsetX)
}

/**
 * 转换Y坐标
 * @param y 原始Y坐标
 * @param rootOffsetY 根节点Y偏移
 * @param isRoot 是否为根节点
 */
export function convertY(y: number, rootOffsetY: number, isRoot = false): number {
  if (isRoot) {
    return 0
  }
  const safeTopHeight = designConfigs.getSafeTopHeight()
  return convertDesignPx(y - rootOffsetY - safeTopHeight)
}

/**
 * 转换宽度
 * @param width 原始宽度
 */
export function convertWidth(width: number): number {
  return convertDesignPx(width)
}

/**
 * 转换高度
 * @param height 原始高度
 * @param isRoot 是否为根节点
 */
export function convertHeight(height: number, isRoot = false): number {
  if (isRoot) {
    const safeTopHeight = designConfigs.getSafeTopHeight()
    const safeBottomHeight = designConfigs.getSafeBottomHeight()
    return convertDesignPx(height - (safeTopHeight + safeBottomHeight))
  }
  return convertDesignPx(height)
}
