import client, { HttpClient } from './HttpClient'
import { endpoints, getBaseURL } from './apiEndpoints'
import { Observable } from 'rxjs'
import {
  User,
  LoginResponse,
  RegisterResponse,
  HotlistEntry,
  HotlistEntryListParams,
  HotlistEntryListResponse,
  HotlistEntryStats,
  Project,
  CreateProjectResponse,
  ProjectFullSnapshot,
  SaveProjectRequest,
  UploadAssetResponse,
} from './types'

// 快速创建端点函数的工厂（可选）
export function createEndpoint<Req = any, Res = any>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
) {
  return async (payload?: Req): Promise<Res> => {
    switch (method) {
      case 'GET':
        return client.get<Res>(path, payload)
      case 'DELETE':
        return client.delete<Res>(path, payload)
      case 'PUT':
        return client.put<Res>(path, payload)
      case 'PATCH':
        return client.patch<Res>(path, payload)
      case 'POST':
      default:
        return client.post<Res>(path, payload)
    }
  }
}

// 认证服务
export const AuthService = {
  async register(email: string, password: string): Promise<RegisterResponse> {
    return client.post<RegisterResponse>(endpoints.AUTH.REGISTER, { email, password })
  },
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await client.post<LoginResponse>(endpoints.AUTH.LOGIN, { email, password })
    if (res?.token) {
      localStorage.setItem('accessToken', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
    }
    return res
  },
  logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/#/login'
  },
  getCurrentUser(): User | null {
    const u = localStorage.getItem('user')
    return u ? (JSON.parse(u) as User) : null
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  },
}

// 用户服务
export const UserService = {
  getProfile: () => client.get<User>(endpoints.USER.PROFILE),
  updateProfile: (payload: Partial<User>) => client.put<User>(endpoints.USER.UPDATE_PROFILE, payload),
  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    client.post<boolean>(endpoints.USER.CHANGE_PASSWORD, payload),
}

// Content 模块
export const ContentService = {
  fetchContentInfosByQuery: (params: {
    tags?: string
    content?: string
    fileType?: string
    page?: number
    limit?: number
  }) => client.post<any>(endpoints.CONTENT.LIST, { params }),
}

// 热榜条目服务（新增的后端接口）
export const HotlistEntriesService = {
  // 查询热榜条目列表
  list: (params?: HotlistEntryListParams) =>
    client.get<HotlistEntryListResponse>(endpoints.HOTLIST_ENTRIES.LIST, params),

  // 获取热榜统计信息
  stats: (params?: { platform?: string; startDate?: string; endDate?: string }) =>
    client.get<{ stats: HotlistEntryStats[] }>(endpoints.HOTLIST_ENTRIES.STATS, params),

  // 获取单个条目详情
  getById: (id: number) =>
    client.get<{ entry: HotlistEntry }>(endpoints.HOTLIST_ENTRIES.DETAIL.replace(':id', id.toString())),

  // 创建新条目
  create: (data: Omit<HotlistEntry, 'id' | 'created_at' | 'updated_at'>) =>
    client.post<{ entry_id: number }>(endpoints.HOTLIST_ENTRIES.CREATE, data),

  // 更新条目
  update: (id: number, data: Partial<Omit<HotlistEntry, 'id' | 'created_at' | 'updated_at'>>) =>
    client.put<{ entry_id: number; message: string }>(
      endpoints.HOTLIST_ENTRIES.UPDATE.replace(':id', id.toString()),
      data,
    ),

  // 删除条目
  delete: (id: number) =>
    client.delete<{ entry_id: number; message: string }>(
      endpoints.HOTLIST_ENTRIES.DELETE.replace(':id', id.toString()),
    ),
}

// Project Service
export const ProjectService = {
  listProjects: () => client.get<Project[]>(endpoints.PROJECTS.LIST),

  createProject: (name: string) => client.post<CreateProjectResponse>(endpoints.PROJECTS.CREATE, { name }),

  getProjectFull: (id: string) => client.get<ProjectFullSnapshot>(endpoints.PROJECTS.FULL.replace(':id', id)),

  saveProject: (id: string, data: SaveProjectRequest) =>
    client.post<{ success: boolean }>(endpoints.PROJECTS.SAVE.replace(':id', id), data),

  deleteProject: (id: string) => client.delete<{ success: boolean }>(endpoints.PROJECTS.DELETE.replace(':id', id)),
}

export const AssetsService = {
  uploadImage: async (file: File): Promise<UploadAssetResponse> => {
    const form = new FormData()
    form.append('file', file)
    return client.request<UploadAssetResponse>({
      url: endpoints.ASSETS.UPLOAD,
      method: 'POST',
      data: form,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// 统一导出，方便调用者按需引入
export const StreamService = {
  createStream(path: string, params: any): Observable<string | { content: string; type?: string }> {
    return new Observable((subscriber) => {
      const controller = new AbortController()
      const url = `${getBaseURL()}${path}`

      const payload: any = {}
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined) payload[key] = value
      })

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const status = response.status
            if ([401, 403].includes(status)) {
              // 与 HttpClient 重定向保持一致
              window.location.href = '/#/login'
            }
            throw new Error(`HTTP ${status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) throw new Error('Empty response body')

          const decoder = new TextDecoder()
          let buffer = ''
          let shouldComplete = false

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const chunks = buffer.split('\n\n')
              buffer = chunks.pop() || ''

              for (const chunk of chunks) {
                if (!chunk.trim()) continue

                // 处理 event: end
                if (chunk.includes('event: end')) {
                  shouldComplete = true
                  continue
                }

                // 提取数据部分
                const lines = chunk.split('\n')
                for (const line of lines) {
                  if (!line.startsWith('data: ')) continue

                  const data = line.slice(6).trim()
                  if (!data || data === '""') continue

                  try {
                    // 尝试解析 JSON
                    const parsed = JSON.parse(data)
                    if ((parsed as any).status === 'completed') {
                      shouldComplete = true
                      continue
                    }
                    if ((parsed as any).content) {
                      const type = (parsed as any).type || 'content'
                      subscriber.next({ content: (parsed as any).content, type })
                      continue
                    }
                    // 如果没有 content 字段，直接发送整个数据
                    subscriber.next(parsed)
                  } catch {
                    // 如果不是 JSON，作为普通文本内容处理
                    const cleanData = data.replace(/^"|"$/g, '')
                    if (cleanData) subscriber.next({ content: cleanData, type: 'content' })
                  }
                }
              }
            }

            if (shouldComplete) subscriber.complete()
          } catch (error) {
            subscriber.error(error)
          } finally {
            reader.releaseLock()
          }
        })
        .catch((error) => subscriber.error(error))

      return () => controller.abort()
    })
  },
  chatStream(messages: any[]) {
    return this.createStream(endpoints.STREAM.CHAT, { messages })
  },
  dataFeed(params: { feedId: string; filters?: object }) {
    return this.createStream(endpoints.STREAM.DATA_FEED, params)
  },
  realtimeMonitor(deviceId: string) {
    return this.createStream(`${endpoints.STREAM.MONITOR}/${deviceId}`, {})
  },
}
export default {
  AuthService,
  UserService,
  ContentService,
  HotlistEntriesService,
  ProjectService,
  AssetsService,
  StreamService,
}
