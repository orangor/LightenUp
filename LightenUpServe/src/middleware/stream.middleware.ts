// src/middleware/stream.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import compression from 'compression'

// 中间件组件 --------------------------------------------------
const compressionMiddleware = compression({
  flush: require('zlib').constants.Z_SYNC_FLUSH,
})

const streamHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  next()
}

const validateStreamBody = [
  // 使用 express-validator 风格验证
  body('messages')
    .isArray()
    .withMessage('messages 必须为数组')
    .custom((messages: any[]) => {
      if (messages.length === 0) throw new Error('消息列表不能为空')
      return true
    }),
  body('messages.*.role').isIn(['system', 'user', 'assistant']).withMessage('无效的角色类型'),
  body('messages.*.content').isString().withMessage('消息内容必须为字符串').notEmpty().withMessage('消息内容不能为空'),
]

// 中间件组合 --------------------------------------------------
export const streamMiddleware = [
  compressionMiddleware,
  streamHeaders,
  validateStreamBody, // 验证中间件数组
  // 假设已存在统一的验证处理器
]
