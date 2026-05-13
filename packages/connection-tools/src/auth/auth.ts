import { request } from '../utils'

/**
 * 在多维表格中新增一条记录
 * @param params 新增记录请求参数
 * @returns 新增记录响应数据
 */
export async function auth() {
  return request.get('lark/authority/tenant_access_token', { credentials: 'include' })
}
