/**
 * 把 union 中每个分支的 K 字段都剔除掉的工具类型。
 * 直接 `Omit<TUnion, K>` 会把成员合并；这里用条件类型走分配律保留判别式。
 */
type DistributiveOmit<TUnion, TKey extends PropertyKey> = TUnion extends unknown
  ? Omit<TUnion, TKey>
  : never

/**
 * 节点序列化后的信息（Claude 可读的 JSON）。
 *
 * 本质是 MasterGo 原生 `SceneNode` 的派生物：
 *  - 去掉运行时的 `children`（树引用无法 JSON 化）
 *  - 用 `childrenIds: string[]` 占位，沿原节点的所有判别式字段保留 union 精度
 *  - `'mixed'` symbol 在序列化时被 replacer 转成字符串 `'mixed'`，类型层保持原样
 */
export type NodeInfo = DistributiveOmit<SceneNode, 'children'> & {
  childrenIds: string[]
}

/** 节点查询错误响应 */
export interface NodeErrorResponse {
  error: string
  nodeId: string
}

/** 一个挂起的 get_node_by_id 请求 */
export interface PendingRequest {
  requestId: string
  nodeId: string
  resolve: (data: NodeInfo | NodeErrorResponse) => void
  reject: (reason: Error) => void
  timeoutHandle: ReturnType<typeof setTimeout>
}

/** get_selected_node 快照语义响应 */
export interface SelectionSnapshot {
  selected: NodeInfo | null
  reason?: 'no_selection' | 'no_plugin_connected'
  freshAt?: number
}

/** POST /node-result 的请求体 */
export interface NodeQueryResponse {
  requestId: string
  data: NodeInfo | NodeErrorResponse
}
