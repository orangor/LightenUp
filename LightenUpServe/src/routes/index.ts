import { Router } from 'express'
import { authConfig } from '../config/auth.config'
import { ResponseMiddleware } from '../middleware/response.middleware'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import csrfRoutes from './csrf.routes'
import modeRoutes from './mode.routes'
import hotlistEntriesRoutes from './hotlist-entries.routes'
import assetsRoutes from './assets.routes'

const router = Router()

// 添加成功响应处理中间件
router.use(ResponseMiddleware.success())

// 认证中间件
router.use((req, res, next) => {
  if (authConfig.shouldCheckAuth(req.path)) {
    return authConfig.authMiddleware(req, res, next)
  }
  next()
})

// 注册路由
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/', csrfRoutes)
router.use('/mode', modeRoutes)
router.use('/hotlist-entries', hotlistEntriesRoutes)
router.use('/', assetsRoutes)

// 错误处理中间件放在最后
router.use(ResponseMiddleware.error())

export default router
