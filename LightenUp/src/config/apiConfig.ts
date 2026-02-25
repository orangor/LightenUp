// src/config/apiConfig.ts

// API基础URL配置
export const API_CONFIG = {
  // 基础URL，可根据环境变量切换
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:8000',
  
  // API端点
  ENDPOINTS: {
    // 认证相关
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH_TOKEN: '/api/auth/refresh-token',
      VERIFY_EMAIL: '/api/auth/verify-email',
      RESET_PASSWORD: '/api/auth/reset-password',
    },
    
    // 用户相关
    USER: {
      PROFILE: '/api/users/profile',
      UPDATE_PROFILE: '/api/users/update-profile',
      CHANGE_PASSWORD: '/api/users/change-password',
    },
    
    // 流式API
    STREAM: {
      CHAT: '/api/mode/chat-stream',
      DATA_FEED: '/v1/data-feed',
      MONITOR: '/monitor',
    },
  },
  
  // 请求超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 重试次数
  MAX_RETRIES: 3,
};

// 错误消息映射
export const ERROR_MESSAGES: { [key: number]: string } = {
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
  // 流式专用错误
  420: '流式连接超时',
  421: '流数据格式错误',
};