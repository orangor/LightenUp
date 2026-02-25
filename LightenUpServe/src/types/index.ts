export interface User {
  id: number
  email: string
  password: string
  created_at: Date
  updated_at: Date
}

export interface HotlistEntry {
  entry_id: number
  platform: string
  date: string | Date | null
  title: string | null
  url: string | null
  description: string | null
  rank: string | null
  heat: string | null
  created_at: Date
  times: string | null
}

export interface HotlistEntryInput {
  platform: string
  date?: string | Date | null
  title?: string | null
  url?: string | null
  description?: string | null
  rank?: string | null
  heat?: string | null
  times?: string | null
}

export interface UserInput {
  email: string
  password: string
}

export interface JwtPayload {
  userId: number
  email: string
}

// 1. 基础类型定义
export interface JsonSchema {
  type: string
  format?: string
  description?: string
  minLength?: number
}

// 2. 请求体结构
export interface RequestBodyContent {
  schema: {
    type: string
    required: string[]
    properties: Record<string, JsonSchema>
  }
  example?: Record<string, any>
}

export interface RequestBodyConfig {
  required: boolean
  content: {
    'application/json': RequestBodyContent
  }
}

// 3. 响应结构
export interface ApiResponseSchema {
  type: 'object'
  properties: {
    success: { type: 'boolean'; description: '操作是否成功' }
    message: { type: 'string'; description: '操作消息' }
    data: any
    timestamp: { type: 'number'; description: '响应时间戳' }
  }
}

export interface ResponseConfig {
  description: string
  content: {
    'application/json': {
      schema: ApiResponseSchema
      example: {
        success: boolean
        message: string
        data: Record<string, any>
        timestamp: number
      }
    }
  }
}

// 4. 参数定义
export interface Parameter {
  in: 'header' | 'query' | 'path' | 'cookie'
  name: string
  required: boolean
  schema: {
    type: string
    format?: string
  }
  description?: string
}

export type Security = { bearerAuth: [] } | { csrfToken: [] } | never[]

// 5. 基础路由信息
export interface BaseRouteInfo {
  path: string
  method: string
  summary: string
  description?: string
  tags: string[]
}

// 6. 运行时路由配置
export interface RuntimeRouteConfig extends BaseRouteInfo {
  handler: Function
  middleware?: any[]
  parameters?: Parameter[]
  requestBody?: RequestBodyConfig
  responseExample?: Record<string, any>
}

// 7. Swagger文档路由配置
export interface SwaggerRouteConfig extends BaseRouteInfo {
  parameters: Parameter[]
  security: Security[]
  requestBody?: RequestBodyConfig
  responses: {
    '200': ResponseConfig
  }
}

// 8. 完整路由信息（用于装饰器）
export interface RouteInfo extends BaseRouteInfo {
  handler: Function
  middleware?: any[]
  parameters?: Parameter[]
  requestBody?: RequestBodyConfig
  responses?: Record<string, ResponseConfig>
  security?: Security[]
  responseExample?: Record<string, any>
}

// 路由元数据（用于装饰器）
export interface RouteMetadata extends BaseRouteInfo {
  handler: Function
  parameters: Parameter[]
  requestBody?: RequestBodyConfig
  responseExample: Record<string, any>
}

// 9. Express类型扩展
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

// Swagger 基础路径配置
export interface BasePathConfig extends SwaggerRouteConfig {
  responses: {
    '200': ResponseConfig
  }
}
