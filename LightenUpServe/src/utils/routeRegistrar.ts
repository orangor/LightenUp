import { Router } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import 'reflect-metadata'

interface RouteMetadata {
  path: string
  method: string
  handler: Function
  middleware?: any[]
}

export class RouteRegistrar {
  static registerControllers(controllersPath: string): Router {
    const router = Router()
    const files = fs.readdirSync(controllersPath)

    console.log('🚀 开始注册装饰器路由...')

    files.forEach((file) => {
      if (file.endsWith('.controller.ts') || file.endsWith('.controller.js')) {
        const controllerPath = path.join(controllersPath, file)

        try {
          const controllerModule = require(controllerPath)
          const controller = controllerModule.default || controllerModule

          if (controller) {
            console.log(`📝 注册控制器: ${file}`)
            this.registerController(router, controller)
          }
        } catch (error) {
          console.error(`❌ 加载控制器失败 ${file}:`, error)
        }
      }
    })

    console.log('✅ 装饰器路由注册完成')
    return router
  }

  private static registerController(router: Router, controller: any) {
    const methodNames = Object.getOwnPropertyNames(controller)
      .filter((prop) => typeof controller[prop] === 'function')
      .filter((prop) => !['length', 'name', 'prototype'].includes(prop))

    methodNames.forEach((methodName) => {
      const metadata = Reflect.getMetadata('route', controller, methodName)

      if (metadata) {
        const { path, method, handler, middleware = [] } = metadata

        // 直接使用装饰器已经处理过的handler，它已经包含了WrapResponse逻辑
        const handlers = [...middleware, handler]

        // 注册路由到Express Router
        switch (method.toLowerCase()) {
          case 'get':
            router.get(path, ...handlers)
            break
          case 'post':
            router.post(path, ...handlers)
            break
          case 'put':
            router.put(path, ...handlers)
            break
          case 'delete':
            router.delete(path, ...handlers)
            break
          case 'patch':
            router.patch(path, ...handlers)
            break
        }

        console.log(`  ✅ ${method.toUpperCase()} ${path}`)
      }
    })
  }
}
