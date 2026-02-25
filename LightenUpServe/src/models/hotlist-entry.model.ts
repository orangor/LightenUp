import { RowDataPacket, ResultSetHeader } from 'mysql2'
import db from '../config/database'
import { HotlistEntry, HotlistEntryInput } from '../types'
import { NotFoundError } from '../utils/errors'

export default class HotlistEntryModel {
  static async findById(entry_id: number): Promise<HotlistEntry | undefined> {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM vlog.HotlistEntries WHERE entry_id = ?',
      [entry_id]
    )
    return rows[0] as HotlistEntry | undefined
  }

  static async create(data: HotlistEntryInput): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO vlog.HotlistEntries (platform, date, title, url, description, rank, heat, times)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.platform,
        data.date ?? null,
        data.title ?? null,
        data.url ?? null,
        data.description ?? null,
        data.rank ?? null,
        data.heat ?? null,
        data.times ?? null,
      ]
    )
    return result.insertId
  }

  static async update(entry_id: number, data: Partial<HotlistEntryInput>): Promise<void> {
    const existing = await this.findById(entry_id)
    if (!existing) throw new NotFoundError('热榜条目不存在')

    const fields: string[] = []
    const values: any[] = []

    const push = (col: string, value: any) => {
      fields.push(`${col} = ?`)
      values.push(value)
    }

    if (data.platform !== undefined) push('platform', data.platform)
    if (data.date !== undefined) push('date', data.date ?? null)
    if (data.title !== undefined) push('title', data.title ?? null)
    if (data.url !== undefined) push('url', data.url ?? null)
    if (data.description !== undefined) push('description', data.description ?? null)
    if (data.rank !== undefined) push('rank', data.rank ?? null)
    if (data.heat !== undefined) push('heat', data.heat ?? null)
    if (data.times !== undefined) push('times', data.times ?? null)

    if (fields.length === 0) return

    values.push(entry_id)
    await db.execute(`UPDATE vlog.HotlistEntries SET ${fields.join(', ')} WHERE entry_id = ?`, values)
  }

  static async delete(entry_id: number): Promise<void> {
    const [result] = await db.execute<ResultSetHeader>('DELETE FROM vlog.HotlistEntries WHERE entry_id = ?', [entry_id])
    if (result.affectedRows === 0) throw new NotFoundError('热榜条目不存在')
  }

  static async list(params: {
    platform?: string
    startDate?: string
    endDate?: string
    title?: string
    minRank?: number
    maxRank?: number
    minHeat?: number
    maxHeat?: number
    page?: number
    limit?: number
    sortBy?: 'date' | 'rank' | 'heat' | 'created_at'
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ total: number; items: HotlistEntry[] }> {
    const {
      platform,
      startDate,
      endDate,
      title,
      minRank,
      maxRank,
      minHeat,
      maxHeat,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = params

    const where: string[] = []
    const values: any[] = []

    if (platform) {
      where.push('platform = ?')
      values.push(platform)
    }
    if (startDate) {
      where.push('date >= ?')
      values.push(startDate)
    }
    if (endDate) {
      where.push('date <= ?')
      values.push(endDate)
    }
    if (title) {
      where.push('title LIKE ?')
      values.push(`%${title}%`)
    }
    // rank/heat 是 varchar，在此提供数值解析过滤（如果存数字字符串）
    if (minRank !== undefined) {
      where.push('CAST(rank AS SIGNED) >= ?')
      values.push(minRank)
    }
    if (maxRank !== undefined) {
      where.push('CAST(rank AS SIGNED) <= ?')
      values.push(maxRank)
    }
    if (minHeat !== undefined) {
      where.push('CAST(heat AS SIGNED) >= ?')
      values.push(minHeat)
    }
    if (maxHeat !== undefined) {
      where.push('CAST(heat AS SIGNED) <= ?')
      values.push(maxHeat)
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const offset = (page - 1) * limit

    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM vlog.HotlistEntries ${whereSQL}`,
      values
    )
    const total = (countRows[0] as any).total as number

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM vlog.HotlistEntries ${whereSQL} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    )

    return { total, items: rows as unknown as HotlistEntry[] }
  }

  static async stats(params: { platform?: string; startDate?: string; endDate?: string }) {
    const { platform, startDate, endDate } = params
    const where: string[] = []
    const values: any[] = []
    if (platform) {
      where.push('platform = ?')
      values.push(platform)
    }
    if (startDate) {
      where.push('date >= ?')
      values.push(startDate)
    }
    if (endDate) {
      where.push('date <= ?')
      values.push(endDate)
    }
    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT platform, COUNT(*) as count
       FROM vlog.HotlistEntries ${whereSQL}
       GROUP BY platform`,
      values
    )
    return (rows as any[]).map((r) => ({ platform: (r as any).platform as string, count: Number((r as any).count) }))
  }
}