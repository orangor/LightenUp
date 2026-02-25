import { RouteMetadata } from '../types'
import 'reflect-metadata'

// 2. 统一的响应处理装饰器
// 负责处理控制器方法的返回值，并通过中间件提供的方法发送响应
function WrapResponse(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const [req, res, next] = args

    try {
      const result = await originalMethod.apply(this, args)
      if (result !== undefined) {
        res.sendSuccess(result)
        return // 不要返回sendSuccess的结果
      }
    } catch (error) {
      next(error)
    }
  }
  return descriptor
}
// 类型守卫
function hasParameters(body: any): body is { properties: any[] } {
  console.log(body && Array.isArray(body?.properties), body?.properties)
  return body && Array.isArray(body?.properties)
}

// 3. 路由装饰器工厂
function createRouteDecorator(method: string) {
  return function (path: string, summary?: string, description?: string, body?: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      // 先应用响应包装
      WrapResponse(target, propertyKey, descriptor)
      // 设置路由元数据

      const isGet = method.toLowerCase() === 'get'

      const routeInfo: RouteMetadata = {
        path,
        method,
        summary: summary || '',
        description,
        tags: [path.split('/')[2]],
        parameters:
          isGet && hasParameters(body)
            ? body.properties.map((p: any) => ({
                in: 'query',
                name: p.name,
                required: !!p.required,
                schema: {
                  type: p.type,
                  format: p.format,
                  enum: p.enum,
                },
                description: p.description,
              }))
            : [],
        requestBody:
          body && !isGet
            ? {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: body.required || [],
                      properties: body.properties || {},
                    },
                    example: body.example || {},
                  },
                },
              }
            : undefined,
        responseExample: body?.responseExample || {},
        handler: descriptor.value,
      }

      Reflect.defineMetadata('route', routeInfo, target, propertyKey)
    }
  }
}

export const Get = createRouteDecorator('get')
export const Post = createRouteDecorator('post')
export const Put = createRouteDecorator('put')
export const Delete = createRouteDecorator('delete')
