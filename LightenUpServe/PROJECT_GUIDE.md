# DaydoServe 后端项目解析文档

本文档旨在帮助开发者快速理解 `daydoserve` 后端项目的架构、请求流转机制以及如何进行接口开发。

## 1. 项目概览

本项目是一个基于 **Node.js**, **Express**, 和 **TypeScript** 的后端服务应用。它采用了一种**混合路由架构**，同时支持传统的 Express 路由定义和基于装饰器（Decorator）的现代控制器模式。

### 核心特性

- **混合路由系统**：支持 `Router` 和 `Decorator` 两种方式定义接口。
- **自动文档生成**：集成 Swagger，能够自动扫描装饰器路由生成 API 文档。
- **安全加固**：内置 Helmet, CORS, CSRF, XSS, RateLimit 等多层安全中间件。
- **统一响应处理**：通过中间件和装饰器实现了标准化的 API 响应格式。

---

## 2. 核心目录结构说明

```
src/
├── app.ts                  # 应用入口文件，配置中间件和路由挂载
├── config/                 # 配置文件 (数据库, Redis, CORS 等)
├── controllers/            # 控制器层 (装饰器路由模式的核心目录)
├── decorators/             # 自定义装饰器 (@Get, @Post, WrapResponse 等)
├── middleware/             # 中间件 (Auth, CSRF, Logger, Response 等)
├── models/                 # 数据模型层 (封装 SQL 操作)
├── routes/                 # 路由定义层 (传统路由模式目录)
├── services/               # 业务逻辑层 (目前主要用于特定功能如 CSRF)
├── utils/                  # 工具类 (Logger, 路由扫描器, 路由注册器)
└── types/                  # TypeScript 类型定义
```

---

## 3. 请求流转机制 (Request Lifecycle)

当一个 HTTP 请求到达服务器时，它会经过以下处理流程：

1.  **入口 (Entry)**: 请求进入 `src/app.ts`。
2.  **全局中间件 (Global Middleware)**:
    - `Helmet`: 安全头部设置。
    - `CORS`: 跨域资源共享配置。
    - `BodyParser`: 解析 JSON 和 URL-encoded 请求体。
    - `CookieParser`: 解析 Cookie。
    - `XSS Middleware`: 防止 XSS 攻击。
    - `RateLimit`: 限制请求频率。
    - `Logger`: 记录请求日志。
    - `CSRF`: 防止跨站请求伪造 (在 `app.use(csrfMiddleware)` 处)。
3.  **路由分发 (Routing)**:
    - **路径 `/api/*`**: 分发给 `src/routes/index.ts` (传统路由模式)。
    - **路径 `/*`**: 分发给 `RouteRegistrar` 注册的控制器 (装饰器模式)。
4.  **控制器 (Controller)**:
    - 执行具体的业务逻辑。
    - 调用 `Model` 层进行数据库操作。
5.  **响应处理 (Response)**:
    - **装饰器模式**: 控制器方法直接返回数据 -> `WrapResponse` 装饰器拦截 -> 调用 `res.sendSuccess` -> 发送标准 JSON 响应。
    - **传统模式**: 控制器手动调用 `res.json` 或 `res.sendSuccess`。
6.  **错误处理 (Error Handling)**:
    - 如果在上述任何环节抛出异常，会进入 `errorHandler` 中间件，返回标准错误响应。

---

## 4. 开发指南：如何新建接口

本项目推荐使用**装饰器模式**来创建新接口，因为它可以自动生成 Swagger 文档并简化响应处理。

### 方式一：装饰器模式（推荐）

**步骤 1**: 在 `src/controllers` 目录下创建一个新的控制器文件，例如 `order.controller.ts`。

**步骤 2**: 编写控制器代码。

```typescript
import { Request, Response } from 'express'
import { Get, Post } from '../decorators/route.decorator' // 引入路由装饰器

class OrderController {
  // 定义 GET 接口
  // 参数说明: 路径, 接口名称, 接口描述
  @Get('/api/orders', '获取订单列表', '分页获取当前用户的订单')
  static async getOrders(req: Request, res: Response) {
    // 1. 获取参数
    const userId = req.user?.userId

    // 2. 调用模型/服务 (示例)
    // const orders = await OrderModel.findByUser(userId);
    const orders = [{ id: 1, name: 'Order 1' }] // 模拟数据

    // 3. 直接返回数据，WrapResponse 装饰器会自动将其封装为 { code: 200, data: ..., message: '操作成功' }
    return orders
  }

  // 定义 POST 接口
  // 第四个参数为 Request Body 的 Schema 定义 (用于验证和文档生成)
  @Post('/api/orders', '创建订单', '创建一个新订单', {
    required: ['productId', 'quantity'],
    properties: [
      { name: 'productId', type: 'number', description: '产品ID' },
      { name: 'quantity', type: 'number', description: '数量' },
    ],
  })
  static async createOrder(req: Request, res: Response) {
    const { productId, quantity } = req.body

    // 业务逻辑...

    return { id: 123, status: 'created' }
  }
}

export default OrderController
```

**步骤 3**: 完成！
无需在其他地方手动注册。`src/app.ts` 中的 `RouteRegistrar` 会自动扫描 `src/controllers` 目录下所有以 `.controller.ts` 结尾的文件并注册路由。

---

### 方式二：传统路由模式

如果不习惯使用装饰器，也可以使用传统的 Express 路由方式。

**步骤 1**: 在 `src/routes` 下新建 `order.routes.ts`。

```typescript
import { Router } from 'express'
// 假设你有一个 OrderController (非装饰器写法) 或者直接写处理函数
import { OrderController } from '../controllers/order.controller'

const router = Router()

router.get('/orders', OrderController.getOrders)
router.post('/orders', OrderController.createOrder)

export default router
```

**步骤 2**: 在 `src/routes/index.ts` 中注册该路由。

```typescript
import orderRoutes from './order.routes'

// ...
router.use('/orders', orderRoutes) // 最终路径为 /api/orders
```

---

## 5. 关键机制解析

### 统一响应结构

项目定义了统一的响应结构，通常如下所示：

```json
{
  "code": 200,
  "data": { ... },
  "message": "操作成功"
}
```

这是通过 `src/decorators/route.decorator.ts` 中的 `WrapResponse` 函数和 `src/middleware/response.middleware.ts` 共同实现的。

### 自动文档生成

Swagger 文档通过 `src/utils/routeScanner.ts` 和 `src/utils/docGenerator.ts` 生成。它们会读取控制器方法上的 `@Get`, `@Post` 等装饰器元数据（Metadata），自动构建 OpenAPI 规范。因此，**务必在装饰器中填写详细的描述和 Schema 信息**，以便生成高质量的 API 文档。

### 数据库操作

目前项目主要使用 `mysql2` 库直接执行 SQL 语句（参考 `src/models/user.model.ts`）。

```typescript
const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id])
```

建议在 `src/models` 中封装所有的数据访问逻辑，控制器只负责调用模型。
