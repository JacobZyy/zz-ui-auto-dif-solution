export function clearUnVisibleNodes(nodeIdList: string[]) {
  const nodeList = nodeIdList.map(it => mg.getNodeById(it)).filter(it => it != null)
  nodeList.forEach(it => it.remove())
}
