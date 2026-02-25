import UserModel from '../../models/user.model'
import db from '../../config/database'
import { NotFoundError } from '../../utils/errors'

describe('UserModel', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.execute('DELETE FROM users')
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
      }

      const userId = await UserModel.create(userData)
      expect(userId).toBeDefined()

      const user = await UserModel.findById(userId)
      expect(user).toBeDefined()
      expect(user?.email).toBe(userData.email)
    })
  })

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
      }

      await UserModel.create(userData)
      const user = await UserModel.findByEmail(userData.email)

      expect(user).toBeDefined()
      expect(user?.email).toBe(userData.email)
    })
  })

  describe('update', () => {
    it('should update user profile', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
      }

      const userId = await UserModel.create(userData)
      await UserModel.update(userId, { email: 'new@example.com' })

      const updatedUser = await UserModel.findById(userId)
      expect(updatedUser?.email).toBe('new@example.com')
    })

    it('should throw error when user not found', async () => {
      await expect(UserModel.update(999, { email: 'new@example.com' })).rejects.toThrow(NotFoundError)
    })
  })
})
