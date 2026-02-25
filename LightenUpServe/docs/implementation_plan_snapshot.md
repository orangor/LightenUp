# V2 编辑器全量状态快照接口技术实施方案

## 1. 核心目标

构建 `GET /api/projects/:projectId/full` 接口，作为编辑器初始化的**唯一事实来源 (Single Source of Truth)**。该接口必须保证数据的完整性、一致性和结构的严格性，任何中间层不得对数据进行非必要的转换或修剪。

## 2. 接口契约定义

### 请求

- **Method**: `GET`
- **Path**: `/api/projects/:projectId/full`
- **Params**: `projectId` (UUID string)

### 响应 (Strict JSON Schema)

```json
{
  "project": {
    "id": "string",
    "name": "string",
    "status": "active | archived",
    "created_at": "ISO8601 String",
    "updated_at": "ISO8601 String"
  },
  "canvases": [
    {
      "id": "string",
      "project_id": "string",
      "name": "string",
      "width": "number",
      "height": "number",
      "safe_top": "number",
      "safe_right": "number",
      "safe_bottom": "number",
      "safe_left": "number",
      "created_at": "ISO8601 String"
    }
  ],
  "groups": [
    {
      "id": "string",
      "project_id": "string",
      "name": "string",
      "locked": "boolean"
    }
  ],
  "nodes": [
    {
      "id": "string",
      "project_id": "string",
      "canvas_id": "string",
      "type": "image | text | shape | group",
      "x": "number",
      "y": "number",
      "width": "number",
      "height": "number",
      "rotation": "number",
      "z_index": "number",
      "locked": "boolean",
      "group_id": "string | null",
      "props": "object (JSON)",
      "created_at": "ISO8601 String",
      "updated_at": "ISO8601 String"
    }
  ]
}
```

## 3. 实现策略 (Rational Implementation)

### 3.1 数据访问层 (DAL)

不使用复杂的 ORM 关联查询，采用 **DAO (Data Access Object)** 模式直接执行 SQL，以确保最高性能和对查询行为的完全控制。

- **ProjectModel**: 负责 `SELECT * FROM projects WHERE id = ?`
- **CanvasModel**: 负责 `SELECT * FROM canvases WHERE project_id = ?`
- **GroupModel**: 负责 `SELECT * FROM groups WHERE project_id = ?`
- **NodeModel**: 负责 `SELECT * FROM nodes WHERE project_id = ?` (注意：这里使用 `project_id` 索引进行一次性全量查询，而不是 N+1 查询)

### 3.2 业务逻辑层 (Controller)

控制器逻辑必须是**无状态且原子的**。

1.  **参数校验**: 验证 `projectId` 格式。
2.  **并发获取**: 使用 `Promise.all` 并行执行 4 个查询。这是性能优化的关键点。
3.  **存在性断言**: 检查 `project` 查询结果。如果为空，立即抛出 `404 NotFoundError`。
4.  **数据组装**: 将 4 个结果集直接映射到响应对象的对应字段。
5.  **响应**: 返回组装好的对象。

### 3.3 关键约束检查

- **不分页**: SQL 查询不使用 `LIMIT/OFFSET`。
- **不裁剪**: `SELECT *` 确保所有字段返回。
- **不合并**: 保持平铺结构，前端负责构建树状关系（如果需要）。
- **Nodes 完整性**: 通过 `project_id` 索引查询 `nodes` 表，保证获取该项目下所有 Canvas 的所有 Node。

## 4. 代码结构规划

### 4.1 Type Definitions (`src/types/editor.ts`)

定义与数据库表结构 1:1 对应的 TypeScript 接口，确保类型安全。

### 4.2 Models (`src/models/editor.model.ts`)

由于这些模型紧密相关且逻辑简单，将它们集中在一个文件中管理，或者使用命名空间 `EditorModels`。

### 4.3 Controller (`src/controllers/project.controller.ts`)

使用现有的装饰器体系 `@Get` 实现路由注册。

## 5. 异常处理

- **404**: 项目不存在。
- **500**: 数据库连接失败或查询错误。
- **403**: (后续迭代) 权限校验失败（当前阶段暂不考虑，但预留位置）。

## 6. 性能考量

- **索引命中**: 确保 SQL 查询能够命中 `project_id` 索引。
- **一次往返**: 所有的查询在一次 HTTP 请求中完成，减少网络 RTT。
- **数据量级**: 假设单个 Project 的 Node 数量在 1000 以内，全量返回 JSON 大小在可控范围内 (KB 级别)。

此方案剥离了所有非必要的情感因素和业务推断，专注于数据的高保真传输。
