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

    // 如果用户存在
    if (existingUser) {
      // 1. 如果已经验证过，直接抛出异常提示已注册
      if (existingUser.email_verified) {
        throw new ValidationError('该邮箱已被注册')
      }

      // 2. 如果未验证，允许重新发送验证邮件

      // 限制：如果已经有有效的 verification_token 且距离上次发送不久，可以拒绝
      // 这里为了用户体验，允许重发，但可以更新密码

      // 更新密码（因为用户可能忘了之前的密码，重新注册时输入了新密码）
      await UserModel.update(existingUser.id, { password })

      // 创建并发送验证邮件
      const verificationToken = await UserModel.createVerificationToken(existingUser.id)
      await sendVerificationEmail(email, verificationToken)

      return {
        userId: existingUser.id,
        message: '邮箱未验证，已更新密码并重新发送验证邮件',
      }
    }

    // 用户不存在，正常创建
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

    // 检查邮箱是否已验证
    if (!user.email_verified) {
      throw new ValidationError('邮箱未验证，请先前往邮箱完成验证')
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

  @Get('/api/verify-email', '邮箱验证跳转', '验证邮箱并跳转到登录页', [
    {
      name: 'token',
      in: 'query',
      required: true,
      schema: { type: 'string' },
      description: '验证令牌',
    },
  ])
  static async verifyEmailLink(req: Request, res: Response) {
    const { token } = req.query
    // 强制使用线上前端地址
    const frontendUrl = 'http://moxae.com'

    if (!token || typeof token !== 'string') {
      return res.redirect(`${frontendUrl}/login?error=invalid_token`)
    }

    try {
      await UserModel.verifyEmail(token)
      return res.redirect(`${frontendUrl}/login?verified=true`)
    } catch (error) {
      console.error('Verify email error:', error)
      const message = error instanceof Error ? error.message : '验证失败'
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`)
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
