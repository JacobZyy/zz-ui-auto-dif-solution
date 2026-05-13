import { v4 as uuidv4 } from 'uuid'

/**
 * 列表节点检测器 - 识别HTML中可能由v-for或循环渲染的节点
 * 并为识别到的列表节点添加标记
 */

const LIST_NODE_TAG = 'list-node-tag'
const MIN_SIMILARITY = 0.7
const MIN_ITEMS = 2

// 权重配置
const WEIGHTS = {
  PATH: 0.4, // DOM路径权重40%
  STRUCTURE: 0.3, // 子元素结构权重30%
  TAG: 0.2, // 标签名权重20%
  ATTRIBUTES: 0.1, // 属性数量权重10%
}

/** 提取元素的class列表 */
function getClassList(element: HTMLElement): string[] {
  return Array.from(element.classList.values())
}

/** 获取从body到当前节点的路径（tagName + className组合） */
function getNodePath(element: HTMLElement): string[] {
  const path: string[] = []
  let current: HTMLElement | null = element

  while (current && current !== document.body) {
    const classes = getClassList(current)
    const pathItem = classes.length > 0
      ? `${current.tagName}.${classes.join('.')}`
      : current.tagName
    path.unshift(pathItem)
    current = current.parentElement
  }

  return path
}

/** 计算两个路径的相似度（编辑距离算法） */
function calculatePathSimilarity(path1: string[], path2: string[]): number {
  if (path1.length !== path2.length)
    return 0

  const matches = path1.filter((item, index) => item === path2[index]).length
  return matches / path1.length
}

/** 计算子元素结构相似度 */
function calculateStructureSimilarity(el1: HTMLElement, el2: HTMLElement): number {
  const children1 = Array.from(el1.children) as HTMLElement[]
  const children2 = Array.from(el2.children) as HTMLElement[]

  if (children1.length !== children2.length)
    return 0

  if (children1.length === 0)
    return 1

  const tagMatches = children1.filter(
    (child, index) => child.tagName === children2[index]?.tagName,
  ).length

  return tagMatches / children1.length
}

/** 计算两个元素的加权相似度 */
function calculateSimilarity(el1: HTMLElement, el2: HTMLElement): number {
  const path1 = getNodePath(el1)
  const path2 = getNodePath(el2)

  const scores = {
    path: calculatePathSimilarity(path1, path2),
    structure: calculateStructureSimilarity(el1, el2),
    tag: el1.tagName === el2.tagName ? 1 : 0,
    attributes: el1.attributes.length === el2.attributes.length ? 1 : 0,
  }

  return (
    scores.path * WEIGHTS.PATH
    + scores.structure * WEIGHTS.STRUCTURE
    + scores.tag * WEIGHTS.TAG
    + scores.attributes * WEIGHTS.ATTRIBUTES
  )
}

/** 找到所有子元素的第一个公共class */
function findCommonClass(children: HTMLElement[]): string | null {
  if (children.length === 0)
    return null

  const firstClasses = getClassList(children[0])
  const commonClass = firstClasses.find(className =>
    children.every(child => getClassList(child).includes(className)),
  )

  return commonClass || null
}

/** 按className分组并返回最大组 */
function findMaxGroup(children: HTMLElement[]): HTMLElement[] {
  const groups = children.reduce(
    (acc, child) => {
      const key = child.className && typeof child.className === 'string' ? child.className : '__no-class__'
      acc[key] = acc[key] || []
      acc[key].push(child)
      return acc
    },
    {} as Record<string, HTMLElement[]>,
  )

  return Object.values(groups).reduce(
    (max, group) => (group.length > max.length ? group : max),
    [] as HTMLElement[],
  )
}

/** 按公共class过滤子元素 */
function filterByCommonClass(children: HTMLElement[]): HTMLElement[] {
  const commonClass = findCommonClass(children)
  if (!commonClass)
    return []

  return children.filter(child => getClassList(child).includes(commonClass))
}

/** 检查元素组是否为列表（相似度检查） */
function isValidListGroup(group: HTMLElement[]): boolean {
  if (group.length < MIN_ITEMS)
    return false

  const [first, ...rest] = group
  const similarities = rest.map(item => calculateSimilarity(first, item))
  const avgSimilarity = similarities.reduce((sum, s) => sum + s, 0) / similarities.length

  return avgSimilarity >= MIN_SIMILARITY
}

/** 获取节点在其父节点中的索引 */
function getChildIndex(element: HTMLElement): number {
  const parent = element.parentElement
  if (!parent)
    return 0
  return Array.from(parent.children).indexOf(element)
}

/** 检查节点是否会成为列表项（通过检查其兄弟节点是否形成列表） */
function willBeListItem(element: HTMLElement): boolean {
  const parent = element.parentElement
  if (!parent)
    return false

  const siblings = Array.from(parent.children) as HTMLElement[]
  if (siblings.length < MIN_ITEMS)
    return false

  // 检查兄弟节点是否形成列表
  const maxGroup = findMaxGroup(siblings)
  if (isValidListGroup(maxGroup) && maxGroup.includes(element))
    return true

  const commonGroup = filterByCommonClass(siblings)
  return isValidListGroup(commonGroup) && commonGroup.includes(element)
}

/** 为列表项内部节点添加路径标记 */
function markDescendantsWithPath(listItem: HTMLElement, baseTag: string): void {
  const traverse = (element: HTMLElement, pathPrefix: string) => {
    const children = Array.from(element.children) as HTMLElement[]

    for (const child of children) {
      // 如果子节点会成为新的列表项，停止标记
      if (willBeListItem(child))
        continue

      // 构建当前节点的路径标记
      const classes = getClassList(child)
      const className = classes.length > 0 ? classes[0] : child.tagName.toLowerCase()
      const childIndex = getChildIndex(child)
      const currentPath = pathPrefix ? `${pathPrefix}-${className}[${childIndex}]` : `${className}[${childIndex}]`
      const fullTag = `${baseTag}-${currentPath}`

      // 设置标记
      child.setAttribute(LIST_NODE_TAG, fullTag)

      // 递归处理子节点
      traverse(child, currentPath)
    }
  }

  traverse(listItem, '')
}

/** 为列表项添加标记 */
function markGroupAsListItems(group: HTMLElement[]): void {
  const listId = uuidv4()
  group.forEach((item) => {
    // 为列表项本身打上uuid标记
    item.setAttribute(LIST_NODE_TAG, listId)
    // 为列表项内部的所有子孙节点打上路径标记
    markDescendantsWithPath(item, listId)
  })
}

/** 尝试识别并标记子元素为列表 */
function tryMarkAsListItems(children: HTMLElement[]): boolean {
  if (children.length < MIN_ITEMS)
    return false

  // 策略1: 完全匹配className
  const maxGroup = findMaxGroup(children)
  if (isValidListGroup(maxGroup)) {
    markGroupAsListItems(maxGroup)
    return true
  }

  // 策略2: 基于公共class
  const commonGroup = filterByCommonClass(children)
  if (isValidListGroup(commonGroup)) {
    markGroupAsListItems(commonGroup)
    return true
  }

  return false
}

/** 递归遍历并标记列表节点 */
function traverseAndMark(element: HTMLElement): void {
  const children = Array.from(element.children) as HTMLElement[]
  if (children.length === 0)
    return

  // 标记
  tryMarkAsListItems(children)

  // 递归
  children.forEach(traverseAndMark)
}

/**
 * 识别并标记列表节点
 * @param element - 要检测的HTML元素
 */
export function detectListNodes(element: HTMLElement): void {
  traverseAndMark(element)
}
