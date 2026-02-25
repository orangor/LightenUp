import { Request, Response, NextFunction } from 'express'

/**（未使用）
 * 性能监控中间件
 * 监控请求处理时间，当超过阈值时发出警告
 * 用于及时发现性能问题
 * 使用方法：
 * 1. 在需要监控的请求处理函数中，添加 `@PerformanceMiddleware.monitor(1000)` 注解
 * 2. 在需要监控的请求处理函数中，添加 `@PerformanceMiddleware.monitor(1000)` 注解
 */
export class PerformanceMiddleware {
  static monitor(threshold: number = 1000) {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime()

      res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start)
        const duration = seconds * 1000 + nanoseconds / 1000000

        if (duration > threshold) {
          console.warn(`[Performance Warning] Slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`)
        }
      })

      next()
    }
  }
}
