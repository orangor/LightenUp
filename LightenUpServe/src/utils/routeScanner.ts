import * as fs from 'fs'
import * as path from 'path'
import { DocGenerator } from './docGenerator'
import { ValidationChain } from 'express-validator'
import { ResponseConfig } from '../types'
import 'reflect-metadata'

interface RouteMetadata {
  path: string
  method: string
  handler: Function
  middleware?: any[]
  validator?: ValidationChain[]
  summary?: string
  description?: string
  requestBody?: any
  parameters?: any[]
}

export class RouteScanner {
  private static routes: RouteMetadata[] = []

  static scanControllers(controllersPath: string) {
    const files = fs.readdirSync(controllersPath)

    // 清空之前的路由
    this.routes = []

    files.forEach((file) => {
      if (file.endsWith('.controller.ts')) {
        const controllerPath = path.join(controllersPath, file)

        const controller = require(controllerPath).default
        this.scanController(controller)
      }
    })

    // 生成文档
    this.generateDocs()
  }

  private static scanController(controller: any) {
    const methodNames = Object.getOwnPropertyNames(controller)
      .filter((prop) => typeof controller[prop] === 'function')
      .filter((prop) => !['length', 'name', 'prototype'].includes(prop)) // 过滤掉这些属性

    methodNames.forEach((methodName) => {
      const metadata = Reflect.getMetadata('route', controller, methodName)

      if (metadata) {
        this.routes.push({
          ...metadata,
        })
      }
    })
  }

  private static generateSummary(path: string): string {
    // 从路径生成概要
    const parts = path.split('/')
    const lastPart = parts[parts.length - 1]
    return lastPart
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private static generateDescription(path: string): string {
    // 从路径生成描述
    return `API endpoint for ${this.generateSummary(path).toLowerCase()}`
  }

  private static extractTag(path: string): string {
    // 从路径提取标签
    const parts = path.split('/')
    return parts[2].charAt(0).toUpperCase() + parts[2].slice(1) // 例如 /api/auth/login -> Auth
  }

  private static generateDocs() {
    this.routes.forEach((route) => {
      DocGenerator.addRoute({
        path: route.path,
        method: route.method,
        summary: route.summary || this.generateSummary(route.path),
        description: route.description || this.generateDescription(route.path),
        tags: [this.extractTag(route.path)],
        parameters: route.parameters || [],
        requestBody: route.requestBody,
        responses: this.extractResponseSchema(route.handler),
        security: this.needsAuth(route.middleware) ? [{ bearerAuth: [] }] : [],
      })
    })
  }

  private static extractResponseSchema(handler: Function): { '200': ResponseConfig } {
    return {
      '200': {
        description: '请求成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', description: '操作是否成功' },
                message: { type: 'string', description: '操作消息' },
                data: { type: 'object', description: '操作数据' },
                timestamp: { type: 'number', description: '响应时间戳' },
              },
            },
            example: {
              success: true,
              message: '操作成功',
              data: {},
              timestamp: Date.now(),
            },
          },
        },
      },
    }
  }

  private static needsAuth(middleware: any[] = []): boolean {
    return middleware.some((m) => m.name === 'authMiddleware')
  }
}
