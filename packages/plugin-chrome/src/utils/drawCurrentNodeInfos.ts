import type { NodeInfo, UniqueId } from '@ui-differ/core'
import { domConfigs } from '@ui-differ/core'

export function drawCurrentNodeInfos(flatNodeMap: Map<UniqueId, NodeInfo>) {
  const rootBounding = domConfigs.getRootBounding()
  const scrollTop = document.scrollingElement?.scrollTop || 0
  console.log('🚀 ~ drawCurrentNodeInfos ~ flatNodeMap:', flatNodeMap)
  // 预定义的颜色数组，用于不同节点的边框颜色
  const colors = [
    '#ff0000', // 红色
    '#00ff00', // 绿色
    '#0000ff', // 蓝色
    '#ffff00', // 黄色
    '#ff00ff', // 紫色
    '#00ffff', // 青色
    '#ffa500', // 橙色
    '#800080', // 紫罗兰
    '#008000', // 深绿色
    '#ffc0cb', // 粉色
  ]

  // 清除之前的绘制元素
  const existingElements = document.querySelectorAll('.ui-differ-node-overlay')
  existingElements.forEach(el => el.remove())

  let colorIndex = 0

  // 遍历所有节点
  flatNodeMap.forEach((nodeInfo) => {
    const { boundingRect } = nodeInfo

    // 创建覆盖层元素
    const overlay = document.createElement('div')
    overlay.className = `ui-differ-node-overlay`
    overlay.setAttribute('node-class', nodeInfo.nodeName)
    overlay.setAttribute('node-id', nodeInfo.uniqueId)

    // 设置样式
    overlay.style.position = 'absolute'
    overlay.style.left = `${boundingRect.x + rootBounding.x}px`
    overlay.style.top = `${boundingRect.y + rootBounding.y + scrollTop}px`
    overlay.style.width = `${boundingRect.width}px`
    overlay.style.height = `${boundingRect.height}px`
    overlay.style.border = `1px solid ${colors[colorIndex % colors.length]}`
    overlay.style.backgroundColor = 'transparent'
    overlay.style.pointerEvents = 'none' // 不阻止鼠标事件
    overlay.style.zIndex = '9999'
    overlay.style.boxSizing = 'border-box'
    overlay.setAttribute('target-node-id', nodeInfo.uniqueId)

    // 添加到页面
    document.body.appendChild(overlay)

    // 更新颜色索引
    colorIndex++
  })
}
