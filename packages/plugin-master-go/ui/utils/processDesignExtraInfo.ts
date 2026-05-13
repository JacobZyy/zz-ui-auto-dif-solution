import type { UIDiffBaseInfo } from '@ui-differ/connection-tools'

interface Options {
  document?: Pick<DocumentNode, 'name' | 'id'>
  currentPage?: Pick<PageNode, 'id' | 'name'>
  currentNode?: SceneNode
  rootDesignNodeInfo: { id: string, name: string }
}
export function processDesignExtraInfo(options: Options): Partial<Omit<UIDiffBaseInfo, 'pageUrl'>> {
  const { currentNode, document, currentPage, rootDesignNodeInfo } = options
  if (!currentNode)
    return {}

  const isAreaDiff = rootDesignNodeInfo.id !== currentNode.id
  const { id: designAreaId, name: designAreaName } = currentNode || {}
  const { id: designId, name: designName } = rootDesignNodeInfo
  return {
    designAreaId: isAreaDiff ? designAreaId : 'fullPage',
    designAreaName: isAreaDiff ? designAreaName : '整体比对',
    designId,
    designName,
    pageId: currentPage?.id?.toString() ?? 'empty',
    pageName: currentPage?.name ?? 'empty',
    documentName: document?.name ?? 'empty',
    documentId: document?.id?.toString() ?? 'empty',
  }
}
