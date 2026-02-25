# 更新文档（方案 A 已选）：以 Canvas `state_json` 为唯一状态源

## 1. 文档更新目标
在 [PERSISTENCE_MAPPING_RATIONALE.md](file:///e:/AiDome/momo/daydo/src/ai-image-editor/PERSISTENCE_MAPPING_RATIONALE.md) 中明确：
- **唯一状态源**：`canvases.state_json`（存 `ProjectData`：`layers + safeArea`）。
- `nodes/groups` 仅作为可选投影/索引（可逐步弃用），不再负责“还原渲染”。
- 强制类型规则（数值/数组/null）与脏数据冲洗策略。

## 2. 数据结构（写入文档）
- `ProjectData`（来源 [serialize.ts](file:///e:/AiDome/momo/daydo/src/ai-image-editor/canvas/services/serialize.ts#L8-L12)）：

```json
{
  "layers": [ /* serialize.ts 产物 */ ],
  "safeArea": { "enabled": true, "visible": true, "top": 50, "right": 50, "bottom": 50, "left": 50, "color": "#00bfff" }
}
```

## 3. 数据库改动（写入文档，含可执行 SQL）
### 3.1 推荐：直接给 `canvases` 增加字段（最小改动）
- `state_json JSON NOT NULL`：存 `ProjectData`。
- `state_version INT NOT NULL DEFAULT 1`：便于未来升级格式。
- `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`：追踪保存时间。

DDL 示例（文档中给出）：
```sql
ALTER TABLE canvases
  ADD COLUMN state_json JSON NOT NULL,
  ADD COLUMN state_version INT NOT NULL DEFAULT 1,
  ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### 3.2 兼容旧数据（过渡期）
- 若历史数据没有 `state_json`：
  - 后端 **首次读取** 时用旧 `nodes/groups` 生成 `ProjectData`（一次性迁移），并写回 `state_json`；
  - 或者前端 fallback（不推荐，因为迁移逻辑应收敛在后端）。

## 4. 接口契约（写入文档，明确 payload）
### 4.1 `GET /api/projects/:id/full`
返回结构调整为：
- `project`
- `canvases`: 每个 canvas 包含 `state_json`（或命名 `state`）

示例：
```json
{
  "project": {"id": "..."},
  "canvases": [{
    "id": "...",
    "name": "Default Canvas",
    "width": 1080,
    "height": 1080,
    "state_json": {"layers": [], "safeArea": {"enabled": true, "visible": true, "top": 50, "right": 50, "bottom": 50, "left": 50, "color": "#00bfff"}}
  }]
}
```

### 4.2 `POST /api/projects/:id/save`
推荐改为只保存 canvas state（强一致）：
```json
{
  "canvases": [
    {"id": "canvas-uuid", "state_json": {"layers": [...], "safeArea": {...}}}
  ]
}
```

## 5. 强制类型与净化规则（写入文档）
**原则**：Fabric 进入/输出 JSON 必须满足 Fabric 类型约束。
- `strokeDashArray`: `number[] | null`
- `shadow/path/stroke`: 空对象 `{}` 一律归一为 `null`
- 所有几何字段：进入 Fabric 前确保 `number`

执行点（文档写清）：
- 前端：`serialize()` 输出后做 sanitize（避免把脏结构写入 DB）。
- 后端：保存前再 sanitize（防守性，抵御非受控客户端）。
- 读取时：若发现脏字段，清洗后再返回（兼容历史数据）。

## 6. 迁移策略（写入文档）
### 6.1 渐进迁移（推荐）
1) 加字段 `state_json`，新项目创建时填默认空 `ProjectData`。
2) 保存接口优先写 `state_json`。
3) 读取接口优先读 `state_json`。
4) 对旧项目：
   - 若 `state_json` 为空/缺失：后端从旧 `nodes/groups` 生成并回填一次；
   - 从此以后只走 `state_json`。

### 6.2 验证清单
- 打开历史项目：不报 Fabric 运行时错误。
- 图层位置/名字符合预期。
- 连续保存后 DB 中不再出现 `strokeDashArray: {}` 等脏结构。

## 7. 文档落地改动（我将执行）
- 直接更新 [PERSISTENCE_MAPPING_RATIONALE.md](file:///e:/AiDome/momo/daydo/src/ai-image-editor/PERSISTENCE_MAPPING_RATIONALE.md)：
  - 改写“长期方案”为方案 A 作为主方案，加入 DDL、接口 payload、迁移步骤。
  - 明确 nodes/groups 为过渡投影，并标注未来可删除路径。
- 可选新增：`DB_MIGRATION_STATE_JSON.md`（如你希望把 SQL/迁移单独沉淀）。

确认后我会开始修改文档文件（只改文档，不动业务代码）。