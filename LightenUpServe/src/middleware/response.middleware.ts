import { Request, Response, NextFunction } from 'express'
import { ResponseWrapper } from '../decorators/response.types'

declare global {
  namespace Express {
    interface Response {
      sendSuccess(data?: any, message?: string): this
      sendCreated(data?: any, message?: string): this
      sendNoContent(): this
    }
  }
}

export class ResponseMiddleware {
  private static readonly DEFAULT_STATUS: Record<string, number> = {
    POST: 201,
    PUT: 200,
    DELETE: 204,
    GET: 200,
    PATCH: 200,
  }

  static success() {
    return (req: Request, res: Response, next: NextFunction) => {
      // 添加更多响应方法
      res.sendSuccess = function (this: Response, data?: any, message: string = '操作成功') {
        const status = ResponseMiddleware.DEFAULT_STATUS[req.method] || 200
        return this.status(status).json(ResponseWrapper.success(data, message))
      }

      // 可以添加其他便捷方法
      res.sendCreated = function (this: Response, data?: any, message: string = '创建成功') {
        return this.status(201).json(ResponseWrapper.success(data, message))
      }

      res.sendNoContent = function (this: Response) {
        return this.status(204).end()
      }

      next()
    }
  }

  static error() {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
      const status = err.status || 500
      const message = err.message || '服务器内部错误'

      res.status(status).json(ResponseWrapper.error(message))
    }
  }
}
