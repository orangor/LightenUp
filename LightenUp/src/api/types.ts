export interface ChatMessage {
  role: string
  content: string
  type?: 'reasoning' | 'content' // 添加消息类型
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  model: 'deepseek-chat'
  frequency_penalty?: number
  max_tokens?: number
  presence_penalty?: number
  response_format?: {
    type: 'text'
  }
  stop?: string[] | null
  stream?: boolean
  stream_options?: any | null
  temperature?: number
  top_p?: number
  tools?: any[] | null
  tool_choice?: 'none' | string
  logprobs?: boolean
  top_logprobs?: number | null
}

export interface ChatCompletionResponse {
  message: ChatMessage
  logprobs?: {
    content: Array<{
      token: string
      logprob: number
      top_logprobs?: Array<{
        token: string
        logprob: number
      }>
    }>
  }
}

// Project Types
export interface Project {
  id: string
  name: string
  user_id: number
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export interface ProjectFullSnapshot {
  project: Project
  canvases: any[]
  groups: any[]
  nodes: any[]
}

export interface CreateProjectResponse {
  projectId: string
  canvasId: string
}

export interface SaveProjectRequest {
  canvases: any[]
  groups?: any[]
  nodes?: any[]
}

export interface UploadAssetResponse {
  assetId: string
  url: string
  type: 'image'
}
// 通用类型
export interface User {
  id: number
  username?: string
  email: string
  role?: string
  permissions?: string[]
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterResponse {
  userId: number
  message: string
}

// 热榜条目相关类型
export interface HotlistEntry {
  id?: number
  entry_id?: number
  platform: string
  date: string
  title?: string
  url?: string
  description?: string
  rank?: string
  heat?: string
  times?: string
  created_at?: string
  updated_at?: string
}

export interface HotlistEntryListParams {
  platform?: string
  startDate?: string
  endDate?: string
  title?: string
  minRank?: number
  maxRank?: number
  minHeat?: number
  maxHeat?: number
  page?: number
  limit?: number
  sortBy?: 'date' | 'rank' | 'heat' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface HotlistEntryListResponse {
  items: HotlistEntry[]
  total: number
}

export interface HotlistEntryStats {
  platform: string
  count: number
  minHeat?: number
  maxHeat?: number
  avgHeat?: number
}
