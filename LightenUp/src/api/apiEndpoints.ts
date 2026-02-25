// 集中端点配置与多环境 BaseURL 管理

// 支持多种来源的 BaseURL：localStorage > Vite/CRA 环境变量 > 默认映射
const envBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && (process as any).env?.REACT_APP_API_BASE_URL) ||
  undefined

const DEFAULT_BASE = {
  production: 'http://www.aipeak.asia',
  staging: 'http://43.143.51.202:8085',
  development: 'http://localhost:8000', // daydoserve 默认端口
} as const

export function getBaseURL(): string {
  const override = (typeof window !== 'undefined' && window.localStorage.getItem('apiBase')) || undefined
  const nodeEnv = (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development'
  return override || envBaseUrl || DEFAULT_BASE[(nodeEnv as keyof typeof DEFAULT_BASE) || 'development']
}

// 所有端点分组集中在此处，便于统一维护与快速添加
export const endpoints = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/update-profile',
    CHANGE_PASSWORD: '/api/users/change-password',
  },
  STREAM: {
    CHAT: '/api/mode/chat-stream',
    DATA_FEED: '/v1/data-feed',
    MONITOR: '/monitor',
  },
  CONTENT: {
    LIST: '/contentInfo',
  },
  HOTLIST: {
    LIST: '/hotList',
  },
  HOTLIST_ENTRIES: {
    LIST: '/api/hotlist-entries',
    STATS: '/api/hotlist-entries/stats',
    DETAIL: '/api/hotlist-entries/:id',
    CREATE: '/api/hotlist-entries',
    UPDATE: '/api/hotlist-entries/:id',
    DELETE: '/api/hotlist-entries/:id',
  },
  PROJECTS: {
    LIST: '/api/projects',
    CREATE: '/api/projects',
    FULL: '/api/projects/:id/full',
    SAVE: '/api/projects/:id/save',
    DELETE: '/api/projects/:id',
  },
  ASSETS: {
    UPLOAD: '/api/assets/upload',
  },
  ENERGY: {
    CONFIG: '/api/energy/config',
    MOMENTS: '/api/energy/moments',
    FEED: '/api/energy/feed',
    INTERACT: '/api/energy/interact',
    UNCLOSED: '/api/energy/unclosed',
  },
} as const

export type EndpointGroup = typeof endpoints
