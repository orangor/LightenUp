import { RowDataPacket, ResultSetHeader } from 'mysql2'
import bcrypt from 'bcryptjs'
import db from '../config/database'
import { User, UserInput } from '../types'
import { NotFoundError } from '../utils/errors'
import jwt from 'jsonwebtoken'

class UserModel {
  static async findByEmail(email: string): Promise<User | undefined> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email])
    return rows[0] as User | undefined
  }

  static async findById(id: number): Promise<User | undefined> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id])
    return rows[0] as User | undefined
  }

  static async create(userData: UserInput): Promise<number> {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    const [result] = await db.execute<ResultSetHeader>('INSERT INTO users (email, password) VALUES (?, ?)', [
      userData.email,
      hashedPassword,
    ])
    return result.insertId
  }

  static async update(id: number, userData: Partial<UserInput>): Promise<void> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    const updates: string[] = []
    const values: any[] = []

    if (userData.email) {
      updates.push('email = ?')
      values.push(userData.email)
    }

    if (userData.password) {
      updates.push('password = ?')
      values.push(await bcrypt.hash(userData.password, 10))
    }

    if (updates.length === 0) return

    values.push(id)
    await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)
  }

  static async delete(id: number): Promise<void> {
    const [result] = await db.execute<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id])
    if (result.affectedRows === 0) {
      throw new NotFoundError('用户不存在')
    }
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }

  static async createVerificationToken(userId: number): Promise<string> {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '24h' })
    await db.execute('UPDATE users SET verification_token = ? WHERE id = ?', [token, userId])
    return token
  }

  static async verifyEmail(token: string): Promise<void> {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    await db.execute('UPDATE users SET email_verified = true, verification_token = NULL WHERE id = ?', [decoded.userId])
  }

  static async createPasswordResetToken(email: string): Promise<string | null> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email])
    if (!rows[0]) return null

    const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET!, { expiresIn: '1h' })
    await db.execute('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [
      token,
      new Date(Date.now() + 3600000),
      rows[0].id,
    ])
    return token
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await db.execute('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [
      hashedPassword,
      decoded.userId,
    ])
  }
}

export default UserModel
