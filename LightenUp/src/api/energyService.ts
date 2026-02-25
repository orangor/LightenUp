import client from './HttpClient'
import { endpoints } from './apiEndpoints'
import {
  EnergyConfigResponse,
  CreateMomentRequest,
  CreateMomentResponse,
  GetFeedParams,
  GetFeedResponse,
  InteractRequest,
  EnergyMoment,
} from './energyTypes'

export const EnergyService = {
  // 获取配置
  getConfig: () => client.get<EnergyConfigResponse>(endpoints.ENERGY.CONFIG),

  // 发布动态
  createMoment: (data: CreateMomentRequest) => client.post<CreateMomentResponse>(endpoints.ENERGY.MOMENTS, data),

  // 获取动态列表
  getFeed: (params: GetFeedParams) => client.get<GetFeedResponse>(endpoints.ENERGY.FEED, params),

  // 互动
  interact: (data: InteractRequest) => client.post<{ success: boolean }>(endpoints.ENERGY.INTERACT, data),

  // 获取未闭环动态
  getUnclosedMoments: () => client.get<EnergyMoment[]>(endpoints.ENERGY.UNCLOSED),
}
