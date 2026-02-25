import { Request, Response, NextFunction } from 'express'
import xss from 'xss'

/**
 * 递归清理对象中的所有字符串
 * @param obj 需要清理的对象
 * @returns 清理后的对象
 */
const sanitizeObject = (obj: any): any => {
  // 如果不是对象，直接处理
  if (typeof obj !== 'object') {
    return typeof obj === 'string' ? xss(obj) : obj
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item))
  }

  // 处理对象
  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = sanitizeObject(obj[key])
    }
  }
  return result
}

/**
 * XSS 清理中间件
 */
export const xssMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 清理请求体
    if (req.body) {
      req.body = sanitizeObject(req.body)
    }

    // 清理查询参数
    if (req.query) {
      req.query = sanitizeObject(req.query)
    }

    // 清理 URL 参数
    if (req.params) {
      req.params = sanitizeObject(req.params)
    }

    next()
  } catch (error) {
    next(error)
  }
}
