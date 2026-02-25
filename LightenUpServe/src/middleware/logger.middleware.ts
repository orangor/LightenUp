import { Request, Response, NextFunction } from 'express'

/**（未使用）
 * 日志中间件
 * 记录请求的开始时间、结束时间、持续时间等信息
 * 用于请求追踪和性能分析
 * 使用方法：
 */
export class LoggerMiddleware {
  static log() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()

      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)

      res.on('finish', () => {
        const duration = Date.now() - startTime
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`)
      })

      next()
    }
  }
}
