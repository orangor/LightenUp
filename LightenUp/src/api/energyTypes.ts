// 能量类型
export interface EnergyType {
  id: number
  name: string
  level_value: number
  color_hex: string
  icon_code: string
  description: string
}

// 贴纸类型
export interface Sticker {
  id: number
  energy_type_id: number
  sticker_url: string
  sticker_name: string
  is_active: boolean
}

// 能量动态媒体
export interface MomentMedia {
  id: number
  moment_id: number
  media_type: number // 1:图片, 2:视频
  file_url: string
  sort_order: number
}

// 能量动态用户
export interface MomentUser {
  id: number
  email: string
}

// 能量动态
export interface EnergyMoment {
  id: number
  user_id: number
  energy_type_id: number
  sticker_id: number
  content_text: string | null
  location: string | null
  visibility: number // 0:私密, 1:公开, 2:匿名
  related_moment_id: number | null
  is_closed_loop: boolean
  like_count: number
  comment_count: number
  created_at: string
  media?: MomentMedia[]
  user?: MomentUser | null
  energy_type?: EnergyType
  sticker?: Sticker
}

// 能量配置响应
export interface EnergyConfigResponse {
  types: EnergyType[]
  stickers: Sticker[]
}

// 创建动态请求
export interface CreateMomentRequest {
  energyTypeId: number
  stickerId: number
  content?: string
  media?: {
    mediaType: number
    fileUrl: string
    sortOrder: number
  }[]
  visibility?: number
  relatedMomentId?: number
  location?: string
}

// 动态列表请求参数
export interface GetFeedParams {
  type?: 'all' | 'follow'
  energy_level?: 'high' | 'low'
  page?: number
  limit?: number
}

// 动态列表响应
export interface GetFeedResponse {
  total: number
  items: EnergyMoment[]
}

// 互动请求
export interface InteractRequest {
  momentId: number
  type: number // 1:充能, 2:评论
  content?: string
  reactionStyle?: string
}

// 发布动态响应
export interface CreateMomentResponse {
  id: number
  message: string
}

export interface TrendPoint {
  moment_id?: number
  energy_type_id?: number
  energy_name?: string
  level_value: number
  created_at: string
  count?: number
}

export interface TrendResponse {
  points: TrendPoint[]
}
