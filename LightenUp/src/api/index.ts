// 统一 API 入口文件，整合 HttpClient、端点配置与服务模块

// HttpClient：类、类型与默认实例
import client from './HttpClient'
import { endpoints as _endpoints } from './apiEndpoints'
import {
  AuthService,
  UserService,
  ContentService,
  HotlistEntriesService,
  StreamService,
  createEndpoint,
} from './apiService'
import { EnergyService } from './energyService'

export { HttpClient } from './HttpClient'
export type { ApiResponse, HttpMethod, HttpClientOptions } from './HttpClient'

// 端点配置与 BaseURL 管理
export { endpoints, getBaseURL } from './apiEndpoints'

// 业务服务模块与快速创建端点工厂
export {
  AuthService,
  UserService,
  ContentService,
  HotlistEntriesService,
  StreamService,
  createEndpoint,
} from './apiService'
export { EnergyService }

// 类型导出：供组件按需引用
export type { HotlistEntry, HotlistEntryListParams, HotlistEntryListResponse, HotlistEntryStats } from './types'
export type { EnergyType, Sticker, EnergyMoment, CreateMomentRequest } from './energyTypes'

// 默认导出一个聚合对象，支持 `import api from '@/api'`
export default {
  client,
  endpoints: _endpoints,
  AuthService,
  ContentService,
  HotlistEntriesService,
  StreamService,
  EnergyService,
}

/**
 * 使用示例：
 *
 * // 命名导入（推荐）
 * import { AuthService, SeedService, StreamService, endpoints, createEndpoint } from '@/api'
 * const loginRes = await AuthService.login(email, password)
 * const card = await SeedService.fetchCard({ ... })
 * const stream$ = StreamService.chatStream(messages)
 *
 * // 快速新增接口：
 * // 1) 在 apiEndpoints.ts 中添加路径，如 endpoints.SEED.MY_NEW_API
 * // 2) 直接使用工厂函数：
 * const myApi = createEndpoint<any, any>(endpoints.SEED.GET_DATA, 'POST')
 * const data = await myApi({ param: ... })
 *
 * // 或默认导出聚合对象（向后兼容）
 * import api from '@/api'
 * await api.AuthService.login(email, password)
 * await api.client.post(endpoints.SEED.ADD_CARD, { param: ... })
 * api.StreamService.chatStream(messages)
 */
