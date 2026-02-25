## API 开发指南

---

### 1. 项目结构

项目结构清晰地分层，便于维护和扩展。

复制

```
src/
├── controllers/
│   ├── auth.controller.ts    // 认证相关
│   ├── user.controller.ts    // 用户相关
│   ├── task.controller.ts    // 任务相关
│   └── your-new.controller.ts  // 新功能的控制器
├── models/
│   ├── user.model.ts
│   ├── task.model.ts
│   └── your-new.model.ts  // 新的数据模型
├── services/
│   ├── auth.service.ts
│   ├── email.service.ts
│   └── your-new.service.ts  // 新的服务逻辑
└── types/
    ├── index.ts
    └── your-new.types.ts  // 新的类型定义
```

### 2. 接口开发流程

#### 2.1 接口设计

- **路径设计** ：`/api/{module}/{resource}`
- **HTTP 方法** ：
- GET：查询数据
- POST：创建数据
- PUT：更新数据
- DELETE：删除数据

#### 2.2 代码实现

1. **创建控制器**
   typescript

   复制

   ```
   @Post('/api/module/resource')
   static async createResource() {
     // 实现逻辑
   }
   ```

2. **添加 Swagger 文档**
   typescript

   复制

   ```
   @Post('/api/module/resource', '创建资源', '详细描述...')
   ```

3. **添加请求验证**
   typescript

   复制

   ```
   requestBody: {
     required: true,
     content: {
       'application/json': {
         schema: {
           type: 'object',
           properties: {
             // 属性定义
           }
         }
       }
     }
   }
   ```

#### 2.3 安全考虑

- 添加认证中间件
- 添加参数验证
- 处理错误情况
- 添加日志记录

#### 2.4 测试验证

1. **Curl 测试**
   bash

   复制

   ```
   curl -X POST "http://localhost:8000/api/module/resource" \
   -H "Authorization: Bearer token" \
   -H "Content-Type: application/json" \
   -d '{"key": "value"}'
   ```

2. **Swagger UI 测试**

   - 访问 `/api-docs`
   - 使用 Authorize 按钮添加 token
   - 测试接口

### 3. 代码规范

#### 3.1 命名规范

- **文件名** ：`{module}.controller.ts`
- **类名** ：`PascalCase`
- **方法名** ：`camelCase`
- **路由路径** ：`kebab-case`

#### 3.2 注释规范

typescript

复制

```
/**
 * 创建新资源
 * @param req 请求对象
 * @param res 响应对象
 * @returns Promise<void>
 */
```

### 4. 错误处理

typescript

复制

```
try {
  // 业务逻辑
} catch (error) {
  next(error)
}
```

### 5. 响应格式

typescript

复制

```
{
  success: boolean,
  message: string,
  data?: any
}
```

### 6. 检查清单

- 路由定义完整
- Swagger 文档完整
- 参数验证完整
- 错误处理完整
- 测试用例完整
- 跨域配置正确
- 认证逻辑正确

---

## 图片资产存储与 Image Node 接入（V1 执行规格）

### 1. 目标

将编辑器中的「图片节点」从前端本地状态升级为服务器统一管理的图片资产，确保：

- 图片可持久化保存
- 刷新 / 重进 / 跨设备可正常显示
- 与现有 Project 保存（canvases.state_json）与 Undo/Redo 架构兼容
- 不引入 OSS / S3 等外部依赖（本期仅本地磁盘）

### 2. 硬约束（必须遵守）

1. 图片必须由服务器存储
2. 前端禁止保存本地路径 / base64（包括 dataURL）
3. image node 只引用服务器返回的 URL
4. 数据库只存公网访问 URL，不存磁盘路径
5. 需保留后续无痛迁移 OSS / S3 的空间（本期不实现）

### 3. 前后端职责（无歧义划分）

#### 3.1 前端职责（Editor / Canvas）

1. 提供本地图片选择能力（file input / drag&drop）
2. 上传图片至后端接口：`POST /api/assets/upload`
3. 使用后端返回结果创建/更新 Fabric 图片对象，并参与现有 layers/state_json 序列化链路
4. image node 的持久化字段必须 100% 可序列化（不依赖浏览器本地路径，不依赖运行时对象引用）

#### 3.2 后端职责（API / Storage）

1. 接收图片上传（multipart/form-data）
2. 将图片保存到服务器本地磁盘（固定目录规范）
3. 暴露静态访问路径（URL 必须可在浏览器直接访问）
4. 写入 `assets` 表（只存公网 URL）
5. 返回标准结构给前端（前端不拼 URL，不关心磁盘路径）

### 4. 服务器存储规范（固定）

#### 4.1 磁盘目录结构（必须一致）

```text
/project-root
  └─ uploads/
     └─ assets/
        └─ images/
           └─ YYYY/
              └─ MM/
                 └─ uuid.ext
```

#### 4.2 规则

- 文件名：`uuid + 原始后缀`
- 不按用户 / 项目分目录
- `uploads` 位于后端项目根目录（以 `process.cwd()` 为准）
- 目录不存在时自动创建（递归创建）

### 5. 静态资源访问规则（必须）

后端必须暴露静态路径映射：

```text
/uploads/assets/images/2026/01/uuid.png   (磁盘)
↓
/assets/images/2026/01/uuid.png          (HTTP Path)
```

执行要求：

- `GET /assets/**` 必须可直接在浏览器访问并返回图片文件
- 前端/数据库里保存的 URL 必须指向 `/assets/...`，而不是 `/uploads/...`

### 6. 上传接口规格（确定）

#### 6.1 POST `/api/assets/upload`

**请求**

- Content-Type: `multipart/form-data`
- 字段名：`file`

**返回（固定）**

```json
{
  "assetId": "uuid",
  "url": "https://api.xxx.com/assets/images/2026/01/uuid.png",
  "type": "image"
}
```

接口行为（必须）：

- 后端生成 `assetId` 与最终 `url`，前端不得传入并覆盖
- `url` 必须为可公网访问的完整 URL（包含协议与域名）

建议校验（理性最小集）：

- 允许类型：`image/png`、`image/jpeg`、`image/webp`
- 文件大小限制：按项目现有 rateLimit 之外再加一层（例如 10MB 上限）
- 超限或非法文件返回 400（统一错误格式）

### 7. 数据库要求（最小可用）

#### 7.1 assets 表（必须）

| 字段名     | 类型     | 说明                     |
| ---------- | -------- | ------------------------ |
| id         | uuid     | assetId                  |
| type       | varchar  | 固定为 `image`           |
| url        | varchar  | 公网访问 URL（完整 URL） |
| created_at | datetime | 创建时间                 |

明确禁止：

- 不存磁盘路径
- 不存 base64/dataURL
- 不存前端传入的 src

### 8. 与现有系统关系（确保兼容）

本项目当前编辑器持久化以 `canvases.state_json`（Fabric 同构）为主；图片资产接入只改变“图片来源”，不改变保存架构：

- 仍使用现有 `saveProject` / `getProjectFull` 链路
- Undo/Redo 与对齐/分组能力保持不变（仍对 Fabric 对象做操作）
- 图片唯一特殊点：Fabric Image 对象必须携带可持久化的 `data.src`（服务器 URL）与 `data.assetId`

### 9. 前端 Image Node 数据结构（执行态与持久化态对齐）

#### 9.1 逻辑数据结构（概念层，供业务理解）

```json
{
  "type": "image",
  "id": "node_uuid",
  "data": {
    "src": "https://api.xxx.com/assets/images/2026/01/uuid.png",
    "assetId": "asset_uuid"
  },
  "position": { "x": 100, "y": 200 },
  "width": 300,
  "height": 200
}
```

#### 9.2 真实落地（对齐 ai-image-editor 的 state_json 结构）

前端当前持久化结构是：

- `ProjectData.layers[*].fabricObject` = `fabricObject.toObject([...,'data'])` 的 JSON
- 因此图片落地要求是：在创建/导入图片时，把以下字段写入 Fabric 对象的 `data`：

```json
{
  "data": {
    "src": "https://api.xxx.com/assets/images/2026/01/uuid.png",
    "assetId": "asset_uuid",
    "layerType": "image",
    "id": "layer_uuid",
    "name": "Image"
  }
}
```

执行要点：

- 顶层图片对象必须设置 `data.src` 与 `data.assetId`，以保证序列化与跨设备恢复
- 不允许把本地文件转成 dataURL 再写入 Fabric（会导致 state_json 体积膨胀且不满足硬约束）

### 10. 前端接入点（ai-image-editor，最小改动面）

当前编辑器工程（`e:\AiDome\momo\daydo\src\ai-image-editor`）里，本地图片导入入口位于：

- `canvas/importImage.ts` 的 `importLocalImage(canvas, file, manager)`：现状通过 `FileReader.readAsDataURL()` 生成 dataURL，再 `fabric.Image.fromURL(dataUrl, ...)` 创建图片对象

本期要求的改造行为（固定）：

1. `importLocalImage` 不能再生成 dataURL；改为：`upload(file) -> { assetId, url }`
2. 上传成功后，统一用 `fabric.Image.fromURL(url, ...)` 创建图片对象（与现有 `importUrlImage` 一致）
3. 在图片对象创建后立即写入可持久化字段：

```ts
img.set('data', {
  ...(img.get('data') || {}),
  src: url,
  assetId,
})
```

4. 继续走现有 `LayerManager.addImage / setBackground`、对齐/分组/Undo/Redo 与 `serialize.ts` 的 state_json 序列化流程，不引入新的保存通道

说明（确保序列化闭环）：

- 当前序列化逻辑对 Fabric 对象会调用 `toObject([...,'data'])`，因此只要 `data.src/assetId` 写入 Fabric 对象，刷新/重进后即可从 state_json 恢复并拉取 URL 对应图片资源

### 11. 验收标准（必须满足）

1. 图片上传后可立即显示在画布
2. 刷新页面后图片仍能正确显示
3. Snapshot/历史版本还原后图片不丢失
4. 浏览器直接访问返回的 URL 可看到图片
5. image layer 可正常参与对齐 / 分组 / 保存 / Undo
