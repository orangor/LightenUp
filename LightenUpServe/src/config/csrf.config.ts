// CSRF 配置
export const csrfConfig = {
  // 忽略 CSRF 检查的路径
  ignorePaths: ['/api'],
  // ['/api-docs', '/favicon.ico', '/public', '/api/csrf-token', '/health-check', '/api/auth'],

  // 检查路径是否需要忽略
  shouldIgnore: (path: string): boolean => {
    const isPathIgnored = csrfConfig.ignorePaths.some((ignorePath) => path.startsWith(ignorePath))
    return isPathIgnored
  },

  // Token 配置
  token: {
    headerName: 'CSRF-Token',
    redis: {
      prefix: 'csrf:',
      value: 'valid',
      expiry: 24 * 60 * 60, // 24小时
    },
    cookie: {
      name: 'csrf-token',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    },
  },
  // Swagger 文档配置
  swagger: {
    parameter: {
      in: 'header' as const,
      name: 'CSRF-Token',
      required: true,
      schema: { type: 'string' },
      description: 'CSRF Token',
    },
  },
  // 响应消息
  messages: {
    missing: 'CSRF token missing',
    invalid: 'Invalid CSRF token',
    success: 'CSRF token is valid',
    error: 'CSRF token validation error',
  },
}
