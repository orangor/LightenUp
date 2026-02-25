import { Router } from 'express'

// 说明：装饰器路由会在 app.ts 中通过 RouteRegistrar 自动注册。
// 该占位路由仅用于保持 routes/index.ts 的导入不报错，避免重复注册。
const router = Router()

export default router