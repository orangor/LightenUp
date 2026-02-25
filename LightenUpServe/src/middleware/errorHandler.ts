import { Request, Response, NextFunction } from 'express'
import { ResponseWrapper } from '../decorators/response.types'

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || 500
  const message = err.message || '服务器内部错误'

  res.status(statusCode).json(ResponseWrapper.error(message))
}
