import { RowDataPacket, ResultSetHeader } from 'mysql2'
import db from '../config/database'
import fs from 'fs'
import path from 'path'

export interface EnergyType {
  id: number
  name: string
  level_value: number
  color_hex: string
  icon_code: string
  description: string
}

export interface Sticker {
  id: number
  energy_type_id: number
  sticker_url: string
  sticker_name: string
  is_active: boolean
}

export interface EnergyMoment {
  id: number
  user_id: number
  energy_type_id: number
  sticker_id: number
  content_text: string | null
  location: string | null
  visibility: number
  related_moment_id: number | null
  is_closed_loop: boolean
  like_count: number
  comment_count: number
  created_at: Date
  media?: MomentMedia[]
  user?: {
    id: number
    email: string
  }
  energy_type?: EnergyType
  sticker?: Sticker
}

export interface MomentMedia {
  id: number
  moment_id: number
  media_type: number
  file_url: string
  sort_order: number
}

export interface MomentInteraction {
  id: number
  moment_id: number
  user_id: number
  interaction_type: number
  reaction_style: string | null
  created_at: Date
}

export interface CreateMomentInput {
  userId: number
  energyTypeId: number
  stickerId: number
  content?: string
  location?: string
  visibility?: number
  relatedMomentId?: number
  media?: { mediaType: number; fileUrl: string; sortOrder: number }[]
}

export interface TrendPoint {
  moment_id?: number
  energy_type_id?: number
  energy_name?: string
  level_value: number
  created_at: Date | string
  count?: number
}

export default class EnergyModel {
  static async getEnergyTypes(): Promise<EnergyType[]> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM cfg_energy_types')
    return rows as EnergyType[]
  }

  static async getStickers(energyTypeId?: number): Promise<Sticker[]> {
    let sql = 'SELECT * FROM cfg_stickers WHERE is_active = 1'
    const params: any[] = []

    if (energyTypeId) {
      sql += ' AND energy_type_id = ?'
      params.push(energyTypeId)
    }

    const [rows] = await db.execute<RowDataPacket[]>(sql, params)
    return rows as Sticker[]
  }

  static async createMoment(data: CreateMomentInput): Promise<number> {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO energy_moments 
        (user_id, energy_type_id, sticker_id, content_text, location, visibility, related_moment_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.userId,
          data.energyTypeId,
          data.stickerId,
          data.content ?? null,
          data.location ?? null,
          data.visibility ?? 1,
          data.relatedMomentId ?? null,
        ],
      )

      const momentId = result.insertId

      if (data.media && data.media.length > 0) {
        const values = data.media.map((m) => [momentId, m.mediaType, m.fileUrl, m.sortOrder])
        // 批量插入
        // 注意：mysql2 的 execute 不支持批量插入的语法 (VALUES ?)，需要手动构建或使用 query
        // 这里使用循环插入简单处理，或者构建多值 SQL
        // 为安全起见，循环插入
        for (const m of data.media) {
          await connection.execute(
            'INSERT INTO moment_media (moment_id, media_type, file_url, sort_order) VALUES (?, ?, ?, ?)',
            [momentId, m.mediaType, m.fileUrl, m.sortOrder],
          )
        }
      }

      // 如果有关联动态，更新闭环状态
      if (data.relatedMomentId) {
        await connection.execute('UPDATE energy_moments SET is_closed_loop = 1 WHERE id = ?', [data.relatedMomentId])
      }

      await connection.commit()
      return momentId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async getFeed(params: {
    userId?: number
    type?: 'all' | 'follow'
    energyLevel?: 'high' | 'low'
    page?: number
    limit?: number
  }): Promise<{ total: number; items: EnergyMoment[] }> {
    const { userId, type = 'all', energyLevel, page = 1, limit = 20 } = params
    const offset = (page - 1) * limit

    let whereSql = '1=1'
    const values: any[] = []

    if (type === 'follow' && userId) {
      // 暂时没有关注逻辑，先占位，后续补充关注表关联
      // whereSql += ' AND user_id IN (SELECT following_id FROM user_follows WHERE follower_id = ?)'
      // values.push(userId)
    } else {
      // 仅显示自己的动态 (私密模式)
      if (userId) {
        whereSql += ' AND user_id = ?'
        values.push(userId)
      } else {
        // 未登录看不到任何动态
        whereSql += ' AND 1=0'
      }
    }

    if (energyLevel) {
      // 假设 level_value >= 200 为高频，< 200 为低频
      if (energyLevel === 'high') {
        whereSql += ' AND energy_type_id IN (SELECT id FROM cfg_energy_types WHERE level_value >= 200)'
      } else {
        whereSql += ' AND energy_type_id IN (SELECT id FROM cfg_energy_types WHERE level_value < 200)'
      }
    }

    // 获取总数
    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM energy_moments WHERE ${whereSql}`,
      values,
    )
    const total = (countRows[0] as any).total

    // 获取列表
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT m.*, 
        u.email as user_email, 
        et.name as energy_name, et.level_value, et.color_hex, et.icon_code,
        s.sticker_url, s.sticker_name
       FROM energy_moments m
       LEFT JOIN users u ON m.user_id = u.id
       LEFT JOIN cfg_energy_types et ON m.energy_type_id = et.id
       LEFT JOIN cfg_stickers s ON m.sticker_id = s.id
       WHERE ${whereSql}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset],
    )

    const moments = rows as any[]

    // 获取媒体附件
    if (moments.length > 0) {
      const momentIds = moments.map((m) => m.id)
      const [mediaRows] = await db.query<RowDataPacket[]>(
        `SELECT * FROM moment_media WHERE moment_id IN (${momentIds.join(',')}) ORDER BY sort_order ASC`,
      )

      // 组装数据
      for (const m of moments) {
        m.media = mediaRows.filter((media: any) => media.moment_id === m.id)
        // 树洞模式处理
        if (m.visibility === 2) {
          m.user = null // 匿名
        } else {
          m.user = { id: m.user_id, email: m.user_email }
        }
        m.energy_type = {
          id: m.energy_type_id,
          name: m.energy_name,
          level_value: m.level_value,
          color_hex: m.color_hex,
          icon_code: m.icon_code,
        }
        m.sticker = {
          id: m.sticker_id,
          sticker_url: m.sticker_url,
          sticker_name: m.sticker_name,
        }
      }
    }

    return { total, items: moments as EnergyMoment[] }
  }

  static async interact(
    userId: number,
    momentId: number,
    type: number,
    content?: string,
    reactionStyle?: string,
  ): Promise<void> {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      await connection.execute(
        'INSERT INTO moment_interactions (moment_id, user_id, interaction_type, reaction_style, created_at) VALUES (?, ?, ?, ?, NOW())',
        [momentId, userId, type, reactionStyle ?? null],
      )

      if (type === 1) {
        await connection.execute('UPDATE energy_moments SET like_count = like_count + 1 WHERE id = ?', [momentId])
      } else if (type === 2) {
        await connection.execute('UPDATE energy_moments SET comment_count = comment_count + 1 WHERE id = ?', [momentId])
        // TODO: 插入评论内容表（如果有独立评论表）
      }

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async getUnclosedMoments(userId: number): Promise<EnergyMoment[]> {
    // 获取过去 7 天的低频动态（未闭环）
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT m.*, et.name as energy_name 
       FROM energy_moments m
       JOIN cfg_energy_types et ON m.energy_type_id = et.id
       WHERE m.user_id = ? 
       AND m.is_closed_loop = 0 
       AND et.level_value < 200
       AND m.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY m.created_at DESC`,
      [userId],
    )
    return rows as EnergyMoment[]
  }

  static async getTrend(params: {
    userId: number
    startDate?: string
    endDate?: string
    days?: number
    limit?: number
    groupBy?: 'raw' | 'hour' | 'day'
  }): Promise<{ points: TrendPoint[] }> {
    const { userId, startDate, endDate, days = 30, limit, groupBy = 'raw' } = params
    const whereParts: string[] = ['m.user_id = ?']
    const values: any[] = [userId]
    const normalizedStartDate = startDate ? new Date(startDate) : null
    const normalizedEndDate = endDate ? new Date(endDate) : null

    if (normalizedStartDate) {
      normalizedStartDate.setHours(0, 0, 0, 0)
      whereParts.push('m.created_at >= ?')
      values.push(normalizedStartDate)
    } else if (days && days > 0) {
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      whereParts.push('m.created_at >= ?')
      values.push(from)
    }

    if (normalizedEndDate) {
      normalizedEndDate.setHours(23, 59, 59, 999)
      whereParts.push('m.created_at <= ?')
      values.push(normalizedEndDate)
    }

    const whereSql = whereParts.join(' AND ')
    let sql = ''

    if (groupBy === 'day') {
      sql = `SELECT 
         DATE(m.created_at) as created_at,
         AVG(et.level_value) as level_value,
         COUNT(*) as count
       FROM energy_moments m
       JOIN cfg_energy_types et ON m.energy_type_id = et.id
       WHERE ${whereSql}
       GROUP BY DATE(m.created_at)
       ORDER BY created_at ASC`
    } else if (groupBy === 'hour') {
      sql = `SELECT 
         DATE_FORMAT(m.created_at, '%Y-%m-%d %H:00:00') as created_at,
         AVG(et.level_value) as level_value,
         COUNT(*) as count
       FROM energy_moments m
       JOIN cfg_energy_types et ON m.energy_type_id = et.id
       WHERE ${whereSql}
       GROUP BY created_at
       ORDER BY created_at ASC`
    } else {
      // Default: raw，按照最新条数查询
      const limitVal = limit && limit > 0 ? limit : 50
      sql = `
      SELECT * FROM (
        SELECT 
           m.id as moment_id,
           m.energy_type_id,
           m.created_at,
           m.content_text as note,
           et.name as energy_name,
           et.level_value,
           et.icon_code as energy_icon
         FROM energy_moments m
         JOIN cfg_energy_types et ON m.energy_type_id = et.id
         WHERE ${whereSql}
         ORDER BY m.created_at DESC
         LIMIT ${limitVal}
      ) as sub
      ORDER BY created_at ASC`
    }

    const [rows] = await db.execute<RowDataPacket[]>(sql, values)

    return { points: rows as unknown as TrendPoint[] }
  }

  static async deleteMoment(momentId: number, userId: number): Promise<boolean> {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      // 1. 检查权限
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM energy_moments WHERE id = ? AND user_id = ?',
        [momentId, userId],
      )

      if (rows.length === 0) {
        await connection.rollback()
        return false // 不存在或无权删除
      }

      // 2. 获取关联媒体文件，以便后续删除
      const [mediaRows] = await connection.execute<RowDataPacket[]>(
        'SELECT file_url FROM moment_media WHERE moment_id = ?',
        [momentId],
      )

      // 3. 删除关联媒体记录
      await connection.execute('DELETE FROM moment_media WHERE moment_id = ?', [momentId])

      // 4. 删除关联互动
      await connection.execute('DELETE FROM moment_interactions WHERE moment_id = ?', [momentId])

      // 4.5 清理关联引用：如果有其他动态引用了此动态（related_moment_id），将其置空并重置闭环状态
      await connection.execute(
        'UPDATE energy_moments SET related_moment_id = NULL, is_closed_loop = 0 WHERE related_moment_id = ?',
        [momentId],
      )

      // 5. 删除动态本身
      const [delResult] = await connection.execute<ResultSetHeader>('DELETE FROM energy_moments WHERE id = ?', [
        momentId,
      ])

      if (delResult.affectedRows === 0) {
        throw new Error(`Failed to delete moment record ${momentId}`)
      }

      await connection.commit()

      // 6. 异步删除物理文件 (不阻塞返回，也不影响事务)
      this.deletePhysicalFiles(mediaRows as { file_url: string }[])

      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  private static deletePhysicalFiles(mediaItems: { file_url: string }[]) {
    // uploads/assets 目录的绝对路径
    // src/models -> src -> root -> uploads/assets
    const assetsDir = path.join(__dirname, '../../uploads/assets')

    mediaItems.forEach((item) => {
      const url = item.file_url
      if (!url) return

      // 提取 /assets/ 之后的部分
      const splitKey = '/assets/'
      const index = url.indexOf(splitKey)
      if (index !== -1) {
        const relPath = url.substring(index + splitKey.length)
        // 防止路径遍历攻击 (虽然是删除操作，但还是要小心)
        const safePath = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '')
        const fullPath = path.join(assetsDir, safePath)

        fs.unlink(fullPath, (err) => {
          // 忽略文件不存在的错误
          if (err && err.code !== 'ENOENT') {
            console.error('[EnergyModel] Failed to delete file:', fullPath, err)
          }
        })
      }
    })
  }
}
