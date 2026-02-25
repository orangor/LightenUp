# V2 编辑器最小保存接口 (Upsert Nodes) 技术实施方案

## 1. 核心目标

实现 `POST /api/projects/:projectId/save` 接口，提供稳定、原子性的全量状态覆盖能力。该接口是编辑器数据持久化的唯一写入口。

## 2. 接口契约定义

### 请求

- **Method**: `POST`
- **Path**: `/api/projects/:projectId/save`
- **Body**: (Strict JSON Schema)

```json
{
  "canvases": [
    {
      "id": "string (UUID)",
      "name": "string",
      "width": "number",
      "height": "number",
      "safe_top": "number",
      "safe_right": "number",
      "safe_bottom": "number",
      "safe_left": "number"
    }
  ],
  "groups": [
    {
      "id": "string (UUID)",
      "name": "string",
      "locked": "boolean"
    }
  ],
  "nodes": [
    {
      "id": "string (UUID)",
      "canvas_id": "string (UUID)",
      "type": "string",
      "x": "number",
      "y": "number",
      "width": "number",
      "height": "number",
      "rotation": "number",
      "z_index": "number",
      "locked": "boolean",
      "group_id": "string (UUID) | null",
      "props": "object (JSON)"
    }
  ]
}
```

### 响应

```json
{
  "success": true
}
```

## 3. 实现策略 (Rational Implementation)

### 3.1 事务控制 (Transaction Management)

整个保存过程必须在单个数据库事务中完成。任何步骤失败，必须回滚所有更改，确保数据一致性。

### 3.2 执行顺序 (Execution Order)

严格遵循先删后插的原则，且顺序必须考虑外键约束：

1.  **开启事务**
2.  **删除旧数据** (逆序删除以满足外键约束)
    - `DELETE FROM nodes WHERE project_id = ?`
    - `DELETE FROM groups WHERE project_id = ?`
    - `DELETE FROM canvases WHERE project_id = ?`
3.  **插入新数据** (顺序插入以满足外键约束)
    - **Canvases**: 批量插入
    - **Groups**: 批量插入
    - **Nodes**: 批量插入
4.  **提交事务**

### 3.3 数据完整性约束

- **后端不生成 ID**: 相信前端传入的所有 ID。
- **强制 Project ID**: 所有插入记录的 `project_id` 必须强制覆写为 URL 参数中的 `projectId`，防止越权写入其他项目。
- **Props 处理**: `nodes.props` 字段需序列化为 JSON 字符串存储。

## 4. 代码结构规划

### 4.1 Type Definitions (`src/types/editor.ts`)

新增 `SaveProjectRequest` 接口，定义请求体结构。

### 4.2 Models (`src/models/editor.model.ts`)

新增 `saveProjectFull` 方法，封装完整的事务逻辑。
使用 `db.getConnection()` 获取连接对象以控制事务。

### 4.3 Controller (`src/controllers/project.controller.ts`)

新增 `saveProject` 方法，使用 `@Post` 装饰器。

## 5. 异常处理

- **数据库错误**: 捕获所有 SQL 异常，执行 `ROLLBACK`，并抛出 500 错误。
- **校验错误**: 如果 `projectId` 无效，抛出 400 错误。

## 6. 性能考量

- **批量插入**: 使用 `INSERT INTO ... VALUES (...), (...), ...` 语法进行批量插入，减少网络交互次数。
- **索引**: `project_id` 索引将加速删除操作。
