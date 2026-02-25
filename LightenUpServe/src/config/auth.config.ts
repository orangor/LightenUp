import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types'
export const authConfig = {
  // 需要认证的路径前缀
  authPaths: ['/users', '/projects', '/api/energy'],

  // Swagger 认证配置
  swagger: {
    parameter: {
      in: 'header' as const,
      name: 'Authorization',
      required: true,
      schema: { type: 'string' },
      description: 'Bearer token',
    },
  },

  // 检查路径是否需要进行认证
  shouldCheckAuth: (path: string): boolean => {
    return authConfig.authPaths.some((authPath) => path.includes(authPath))
  },

  authMiddleware: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader) {
        res.status(401).json({ message: '未提供认证令牌' })
        return
      }

      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

      req.user = decoded
      next()
    } catch (error) {
      res.status(401).json({ message: '无效的认证令牌' })
    }
  },
} as const
