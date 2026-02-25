import { Request, Response, NextFunction } from 'express'
import UserModel from '../models/user.model'
import { ValidationError } from '../utils/errors'
import { Get, Put, Delete } from '../decorators/route.decorator'
class UserController {
  @Get('/api/users/profile', '获取用户信息', '获取当前登录用户的详细信息')
  static async getProfile(req: Request, res: Response) {
    const userId = req.user?.userId
    const user = await UserModel.findById(userId!)

    if (!user) {
      throw new ValidationError('用户不存在')
    }

    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  @Put('/api/users/profile', '更新用户信息', '更新当前登录用户的信息', {
    required: ['email'],
    properties: [
      {
        type: 'string',
        format: 'email',
        description: '用户邮箱',
      },
      {
        type: 'string',
        format: 'password',
        description: '用户密码（可选）',
        minLength: 8,
      },
    ],
  })
  static async updateProfile(req: Request, res: Response) {
    const userId = req.user?.userId
    const { email, password } = req.body

    await UserModel.update(userId!, { email, password })

    return { message: '用户信息更新成功' }
  }

  @Delete('/api/users/account', '删除账户', '删除当前用户的账户')
  static async deleteAccount(req: Request, res: Response) {
    const userId = req.user?.userId
    await UserModel.delete(userId!)

    return { message: '账户删除成功' }
  }
}

export default UserController
