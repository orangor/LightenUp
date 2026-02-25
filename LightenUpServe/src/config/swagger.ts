import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DayDo API 文档',
      version: '1.0.0',
      description: 'DayDo  API 接口文档',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: '开发服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '请输入 JWT token',
        },
        csrfToken: {
          // 添加 CSRF token 配置
          type: 'apiKey',
          in: 'header',
          name: 'CSRF-Token',
        },
      },
    },
    security: [
      { bearerAuth: [] }, // Bearer token 认证
      { csrfToken: [] }, // CSRF token 认证
    ],
    paths: {},
  },
  apis: [],
}

export const updatePaths = (paths: any) => {
  const firstPath = Object.keys(paths)[0]

  options.definition.paths = paths
}

interface SwaggerSpec {
  paths: Record<string, any>
  [key: string]: any
}

export const getSpecs = () => {
  const specs = swaggerJsdoc(options) as SwaggerSpec
  return specs
}
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      theme: 'monokai',
    },
  },
} as const
