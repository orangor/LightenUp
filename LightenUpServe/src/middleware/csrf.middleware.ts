import { Request, Response, NextFunction } from 'express'
import { csrfConfig } from '../config/csrf.config'
import { CsrfService } from '../services/csrf.service'

export const csrfMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // 如果是忽略的路径，直接通过
  if (csrfConfig.shouldIgnore(req.path) || req.path.startsWith('/api/energy')) {
    return next()
  }

  try {
    const headerName = csrfConfig.token.headerName.toLowerCase()
    const token = req.headers[headerName] as string

    if (!token) {
      return res.status(403).json({
        success: false,
        message: csrfConfig.messages.missing,
        timestamp: Date.now(),
      })
    }

    // 使用服务的验证方法
    const isValid = await CsrfService.validateToken(token)
    if (!isValid) {
      return res.status(403).json({
        success: false,
        message: csrfConfig.messages.invalid,
        timestamp: Date.now(),
      })
    }

    next()
  } catch (error) {
    console.error(csrfConfig.messages.error, error)
    next(error)
  }
}
