import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import UserModel from '../models/user.model'
import { ValidationError } from '../utils/errors'
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email'
import { Post, Get } from '../decorators/route.decorator'

class AuthController {
  @Post('/api/auth/register', '用户注册', '创建新用户账户并发送验证邮件', {
    required: ['email', 'password'],
    example: {
      email: 'newuser@example.com',
      password: 'password123',
    },
  })
  static async register(req: Request, res: Response) {
    const { email, password } = req.body

    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      throw new ValidationError('该邮箱已被注册')
    }

    const userId = await UserModel.create({ email, password })

    // 创建并发送验证邮件
    const verificationToken = await UserModel.createVerificationToken(userId)
    await sendVerificationEmail(email, verificationToken)

    // 直接返回数据，让装饰器处理响应格式
    return {
      userId,
      message: '注册成功，请查收验证邮件',
    }
  }

  @Post('/api/auth/login', '用户登录', '用户登录接口', {
    required: ['email', 'password'],
    properties: [
      {
        type: 'string',
        name: 'email',
        description: '用户邮箱',
      },
      {
        type: 'string',
        name: 'password',
        description: '用户密码',
        minLength: 8,
      },
    ],
    example: {
      email: 'user@example.com',
      password: 'password123',
    },
    responseExample: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 1,
        email: 'user@example.com',
      },
    },
  })
  static async login(req: Request, res: Response) {
    const { email, password } = req.body

    const user = await UserModel.findByEmail(email)
    if (!user) {
      throw new ValidationError('用户名或密码错误')
    }

    const isValidPassword = await UserModel.verifyPassword(password, user.password)
    if (!isValidPassword) {
      throw new ValidationError('用户名或密码错误')
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    // 直接返回数据，让装饰器处理响应格式
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    }
  }

  @Get('/api/auth/verify-email', '验证邮箱', '验证用户邮箱地址', [
    {
      name: 'token',
      in: 'query',
      required: true,
      schema: { type: 'string' },
      description: '验证令牌',
    },
  ])
  static async verifyEmail(req: Request, res: Response) {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      throw new ValidationError('无效的验证令牌')
    }

    await UserModel.verifyEmail(token)

    return { message: '邮箱验证成功' }
  }

  @Post('/api/auth/forgot-password', '请求重置密码', '发送重置密码邮件到用户邮箱', {
    required: ['email'],

    example: {
      email: 'newuszzzzer@example.com',
    },
  })
  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body

    const token = await UserModel.createPasswordResetToken(email)
    if (!token) {
      throw new ValidationError('未找到该邮箱对应的用户')
    }

    await sendPasswordResetEmail(email, token)

    return { message: '密码重置邮件已发送，请检查您的邮箱' }
  }

  @Post('/api/auth/reset-password', '重置密码', '使用重置令牌设置新密码', {
    required: ['token', 'password'],
    example: {
      token: 'newuser@example.com',
      password: 'password123',
    },
  })
  static async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body

    await UserModel.resetPassword(token, password)

    return { message: '密码重置成功' }
  }
}

export default AuthController
