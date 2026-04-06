import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { endpoints, getBaseURL } from './apiEndpoints'

// 错误消息映射（统一使用中文提示）
const ERROR_MESSAGES: Record<number, string> = {
  400: '错误请求',
  401: '请检查用户名和密码',
  403: '身份过期请重新登录',
  404: '请求错误,未找到该资源',
  405: '请求方法未允许',
  408: '请求超时',
  500: '服务器端出错',
  501: '网络未实现',
  502: '网络错误',
  503: '服务不可用',
  504: '网络超时',
}

export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  timestamp?: number
  [key: string]: any
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

function getToken(): string | null {
  return localStorage.getItem('accessToken')
}

function setToken(token: string | null) {
  if (!token) return localStorage.removeItem('accessToken')
  localStorage.setItem('accessToken', token)
}

function redirectToLogin() {
  // 兼容两种路由方案
  window.location.href = '/#/login'
}

async function refreshToken(): Promise<string | null> {
  try {
    const refresh = localStorage.getItem('refreshToken')
    if (!refresh) return null

    const resp = await axios.post(`${getBaseURL()}${endpoints.AUTH.REFRESH_TOKEN}`, { refreshToken: refresh })
    const token = resp.data?.token
    if (token) setToken(token)
    return token || null
  } catch {
    return null
  }
}

export interface HttpClientOptions {
  baseURL?: string
  timeout?: number
  withCredentials?: boolean
}

export class HttpClient {
  private instance: AxiosInstance

  constructor(options: HttpClientOptions = {}) {
    const baseURL = options.baseURL || getBaseURL()

    this.instance = axios.create({
      baseURL,
      timeout: options.timeout ?? 30000,
      withCredentials: options.withCredentials ?? false,
    })

    // 请求拦截器：附加 Authorization
    this.instance.interceptors.request.use((config) => {
      const token = getToken()
      if (token) {
        config.headers = config.headers || {}
        // 确保添加 Bearer 前缀
        const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`
        config.headers['Authorization'] = authHeader
      }
      return config
    })

    // 响应拦截器：统一错误与刷新Token
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status: number | undefined = error.response?.status
        const backendMsg = error.response?.data?.message || error.response?.data?.msg

        if (backendMsg === 'Token已过期' || status === 401 || status === 403) {
          // 尝试刷新token并重试一次
          const newToken = await refreshToken()
          if (newToken) {
            const original: AxiosRequestConfig = error.config
            original.headers = original.headers || {}
            original.headers['Authorization'] = newToken
            return this.instance.request(original)
          }
          message.error(ERROR_MESSAGES[status || 401] || '认证已过期，请重新登录')
          redirectToLogin()
          return Promise.reject(error)
        }

        const errText = backendMsg || ERROR_MESSAGES[status || 500] || '未知错误'
        message.error(errText)
        return Promise.reject(error)
      },
    )
  }

  // 通用请求
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const resp: AxiosResponse<ApiResponse<T> | T> = await this.instance.request(config)
    // 后端可能返回 { success, data } 或直接返回对象
    const data = resp.data as any
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as ApiResponse<T>).data as T
    }
    return data as T
  }

  // 便捷方法（支持类型）
  async get<T = any>(url: string, params?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ url, method: 'GET', params, ...config })
  }

  async post<T = any>(url: string, body?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ url, method: 'POST', data: body, ...config })
  }

  async put<T = any>(url: string, body?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ url, method: 'PUT', data: body, ...config })
  }

  async delete<T = any>(url: string, params?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ url, method: 'DELETE', params, ...config })
  }

  // 新增：PATCH 方法，供 createEndpoint 使用
  async patch<T = any>(url: string, body?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ url, method: 'PATCH', data: body, ...config })
  }
}

// 默认导出一个单例，便于直接使用
const defaultClient = new HttpClient()
export default defaultClient
