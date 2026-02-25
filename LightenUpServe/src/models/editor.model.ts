import db from '../config/database'
import { Project, Canvas, Group, Node, SaveProjectRequest } from '../types/editor'
import { RowDataPacket } from 'mysql2'
import { v4 as uuidv4 } from 'uuid'
import { buildStateFromStructured, defaultProjectData, parseStateJson } from '../utils/editorState'

export class EditorModels {
  static async getProjectById(projectId: string): Promise<Project | null> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM projects WHERE id = ?', [projectId])
    return (rows[0] as Project) || null
  }

  static async getProjectsByUserId(userId: number): Promise<Project[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, name, status, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    )
    return rows as Project[]
  }

  static async createProject(userId: number, name: string): Promise<{ projectId: string; canvasId: string }> {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const projectId = uuidv4()
      const canvasId = uuidv4()
      const initialState = JSON.stringify(defaultProjectData())
      const safe = defaultProjectData().safeArea

      // 1. 创建项目
      await connection.execute('INSERT INTO projects (id, user_id, name) VALUES (?, ?, ?)', [projectId, userId, name])

      // 2. 创建默认画布 (1080x1080)
      await connection.execute(
        'INSERT INTO canvases (id, project_id, name, width, height, safe_top, safe_right, safe_bottom, safe_left, state_json, state_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          canvasId,
          projectId,
          'Default Canvas',
          1080,
          1080,
          safe.top,
          safe.right,
          safe.bottom,
          safe.left,
          initialState,
          1,
        ]
      )

      await connection.commit()

      return { projectId, canvasId }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      // 1. 删除项目关联的资源 (Nodes -> Groups -> Canvases)
      await connection.execute('DELETE FROM nodes WHERE project_id = ?', [projectId])
      await connection.execute('DELETE FROM `groups` WHERE project_id = ?', [projectId])
      await connection.execute('DELETE FROM canvases WHERE project_id = ?', [projectId])

      // 2. 删除项目本身
      await connection.execute('DELETE FROM projects WHERE id = ?', [projectId])

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async getCanvasesByProjectId(projectId: string): Promise<Canvas[]> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM canvases WHERE project_id = ?', [projectId])
    return (rows as any[]).map((row) => {
      const state = row.state_json === undefined ? undefined : parseStateJson(row.state_json)
      return { ...row, state_json: state } as Canvas
    })
  }

  static async getGroupsByProjectId(projectId: string): Promise<Group[]> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM `groups` WHERE project_id = ?', [projectId])
    return rows as Group[]
  }

  static async getNodesByProjectId(projectId: string): Promise<Node[]> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM nodes WHERE project_id = ?', [projectId])
    return rows as Node[]
  }

  static async saveProjectFull(projectId: string, data: SaveProjectRequest): Promise<void> {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      // 1. 删除旧数据（注意删除顺序：Nodes -> Groups -> Canvases，以满足外键约束）
      await connection.execute('DELETE FROM nodes WHERE project_id = ?', [projectId])
      await connection.execute('DELETE FROM `groups` WHERE project_id = ?', [projectId])
      await connection.execute('DELETE FROM canvases WHERE project_id = ?', [projectId])

      // 2. 批量插入新数据（注意插入顺序：Canvases -> Groups -> Nodes）

      // 插入 Canvases
      if (data.canvases.length > 0) {
        const canvasValues = data.canvases.map((c) => [
          c.id,
          projectId,
          c.name,
          c.width,
          c.height,
          c.safe_top,
          c.safe_right,
          c.safe_bottom,
          c.safe_left,
          JSON.stringify(
            buildStateFromStructured({
              canvas: c as any,
              groups: data.groups as any,
              nodes: (data.nodes as any[]).filter((n) => n.canvas_id === c.id) as any,
            })
          ),
          1,
        ])
        await connection.query(
          'INSERT INTO canvases (id, project_id, name, width, height, safe_top, safe_right, safe_bottom, safe_left, state_json, state_version) VALUES ?',
          [canvasValues]
        )
      }

      // 插入 Groups
      if (data.groups.length > 0) {
        const groupValues = data.groups.map((g) => [g.id, projectId, g.name, g.locked])
        await connection.query('INSERT INTO `groups` (id, project_id, name, locked) VALUES ?', [groupValues])
      }

      // 插入 Nodes
      if (data.nodes.length > 0) {
        const nodeValues = data.nodes.map((n) => {
          // 确保 group_id 有效。如果 group_id 不在 data.groups 中，则设为 null。
          // 这是为了防止前端传递了 group_id 但没有对应的 group 数据（虽然理论上不应该发生，但作为防守性编程）
          // 另外，用户遇到的错误是外键约束失败，说明插入 node 时引用的 group_id 在 groups 表中不存在。
          // 我们的插入顺序是 Groups -> Nodes，所以只要 data.groups 包含该 ID，就应该没问题。
          // 但是，如果 data.groups 为空（如用户输入所示），而 node 却有 group_id（如 null），则没问题。
          // 等等，用户输入中 "group_id": null。
          // 错误信息：CONSTRAINT `nodes_ibfk_3` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL
          // 报错是因为 group_id 的值。如果 group_id 是 null，通常不会触发外键约束（除非字段定义为 NOT NULL）。
          // 让咱们仔细看用户的输入： "group_id": null
          // 如果 group_id 是 null，MySQL 外键通常允许。
          // 难道是前端传的 "null" 字符串？不，JSON 显示是 null。
          // 或者是某些 node 有 group_id 但对应的 group 没传？
          // 用户的输入里 groups: []，nodes: [{... group_id: null ...}]。
          // 这种情况下应该没问题。

          // 让我们再看一眼错误信息：
          // "Cannot add or update a child row: a foreign key constraint fails (`daydo`.`nodes`, CONSTRAINT `nodes_ibfk_3` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL)"

          // 也许是之前的代码逻辑问题？
          // 在 saveProjectFull 中：
          // 1. DELETE nodes
          // 2. DELETE groups
          // 3. DELETE canvases
          // 4. INSERT canvases
          // 5. INSERT groups
          // 6. INSERT nodes

          // 如果事务执行顺序正确，且数据本身没问题（group_id 为 null），不应该报错。
          // 除非... 数据库里的 group_id 字段定义有问题？
          // 或者 nodeValues 映射时，null 被转换成了其他东西？

          // 让我们检查一下 nodeValues 的映射。
          // n.group_id 是 null。
          // [..., n.group_id, ...] -> [..., null, ...]
          // mysql2 驱动应该能正确处理 null。

          // 还有一种可能：数据库中存在脏数据，或者外键约束不仅仅是 ID？
          // 或者是并发问题？但这里有事务。

          // 等等，如果 group_id 是 undefined，会被转成 NULL 吗？
          // JSON.stringify 会忽略 undefined。但在数组中，map 返回的数组元素如果是 undefined...
          // 但这里是 n.group_id。

          // 让我们加一个显式的 null 检查和转换，确保万无一失。
          // const validGroupId = data.groups.find(g => g.id === n.group_id) ? n.group_id : null;
          // 即：如果 n.group_id 不为空，但不在本次保存的 groups 列表中，强制置为 null。
          // 这能解决 "孤儿节点" 引用了不存在的 group 的问题。

          let finalGroupId = n.group_id
          if (finalGroupId) {
            const groupExists = data.groups.some((g) => g.id === finalGroupId)
            if (!groupExists) {
              finalGroupId = null // 强制解除无效的组关系
            }
          }

          return [
            n.id,
            projectId,
            n.canvas_id,
            n.type,
            n.x,
            n.y,
            n.width,
            n.height,
            n.rotation,
            n.z_index,
            n.locked,
            finalGroupId,
            JSON.stringify(n.props),
          ]
        })

        await connection.query(
          'INSERT INTO nodes (id, project_id, canvas_id, type, x, y, width, height, rotation, z_index, locked, group_id, props) VALUES ?',
          [nodeValues]
        )
      }

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async saveProjectCanvasStates(
    projectId: string,
    canvases: Array<{
      id: string
      name?: string
      width?: any
      height?: any
      safe_top?: any
      safe_right?: any
      safe_bottom?: any
      safe_left?: any
      state_json?: any
    }>
  ): Promise<void> {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const toFiniteNumber = (v: any, fallback: number) => {
        const n = typeof v === 'number' ? v : Number(v)
        return Number.isFinite(n) ? n : fallback
      }

      for (const c of canvases) {
        const state = parseStateJson(c.state_json)
        const safe = state.safeArea

        const safeTop = c.safe_top ?? safe.top
        const safeRight = c.safe_right ?? safe.right
        const safeBottom = c.safe_bottom ?? safe.bottom
        const safeLeft = c.safe_left ?? safe.left

        await connection.execute(
          `
          INSERT INTO canvases (id, project_id, name, width, height, safe_top, safe_right, safe_bottom, safe_left, state_json, state_version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            width = VALUES(width),
            height = VALUES(height),
            safe_top = VALUES(safe_top),
            safe_right = VALUES(safe_right),
            safe_bottom = VALUES(safe_bottom),
            safe_left = VALUES(safe_left),
            state_json = VALUES(state_json),
            state_version = state_version + 1
        `,
          [
            c.id,
            projectId,
            c.name || 'Canvas',
            toFiniteNumber(c.width, 0),
            toFiniteNumber(c.height, 0),
            toFiniteNumber(safeTop, 0),
            toFiniteNumber(safeRight, 0),
            toFiniteNumber(safeBottom, 0),
            toFiniteNumber(safeLeft, 0),
            JSON.stringify(state),
          ]
        )
      }

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
