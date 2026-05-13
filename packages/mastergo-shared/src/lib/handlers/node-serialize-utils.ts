/**
 * Distributive Omit — 对 union 类型中每个成员分别应用 Omit，保留 discriminated union 结构。
 * 直接用 Omit<SceneNode, 'children'> 会合并所有成员导致类型丢失。
 */
type DistributiveOmit<TUnion, TKey extends PropertyKey> = TUnion extends unknown
  ? Omit<TUnion, TKey>
  : never

/** SceneNode 去掉 children，再补上 childrenIds */
export type SerializedNode<TNode extends { id: string }> = DistributiveOmit<TNode, 'children'> & {
  childrenIds: string[]
}

/** 将节点的 children 替换为 childrenIds，其余字段原样保留 */
export function serializeNode<TNode extends SceneNode>(node: TNode): SerializedNode<TNode> {
  const { children: _children, ...rest } = node as TNode & { children?: unknown }
  return { ...rest, childrenIds: extractChildrenIds(node) } as SerializedNode<TNode>
}

/** Extract child node IDs from a node, filtering to only valid { id: string } entries */
export function extractChildrenIds(node: unknown): string[] {
  if (typeof node !== 'object' || node === null || !('children' in node))
    return []
  const children = (node as { children: unknown }).children
  if (!Array.isArray(children))
    return []
  return children
    .filter(
      (c): c is { id: string } =>
        typeof c === 'object'
        && c !== null
        && 'id' in c
        && typeof (c as { id: unknown }).id === 'string',
    )
    .map(c => c.id)
}
