import { redis } from '../config/redis'
import { v4 as uuidv4 } from 'uuid'
import { csrfConfig } from '../config/csrf.config'

export class CsrfService {
  // 生成新token
  static async generateToken(userId: string = 'anonymous') {
    const token = uuidv4()
    const { prefix, value, expiry } = csrfConfig.token.redis

    await redis.set(`${prefix}${token}`, value, 'EX', expiry)
    return token
  }

  // 验证token
  static async validateToken(token: string) {
    try {
      // 1. 检查 token 格式
      if (!token) return false

      // 2. 构造 key
      const key = `csrf:${token}`

      // 3. 检查 Redis 连接
      if (redis.status !== 'ready') {
        console.error('Redis not ready')
        return false
      }

      // 4. 获取值
      const value = await redis.get(key)

      // 5. 验证结果
      return value !== null
    } catch (error) {
      console.error(csrfConfig.messages.error, error)
      return false
    }
  }
}
