import db from '../config/database'
import { ResultSetHeader } from 'mysql2'

export type AssetType = 'image'

export interface AssetRecord {
  id: string
  type: AssetType
  url: string
  created_at: string
}

export class AssetModels {
  static async createAsset(id: string, type: AssetType, url: string): Promise<void> {
    await db.execute<ResultSetHeader>(
      `
      INSERT INTO assets (id, type, url, created_at)
      VALUES (?, ?, ?, NOW())
    `,
      [id, type, url]
    )
  }
}

