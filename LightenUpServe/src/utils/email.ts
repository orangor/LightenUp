import nodemailer from 'nodemailer'
import { ValidationError } from './errors'

class EmailService {
  private static instance: EmailService
  private transporter: nodemailer.Transporter

  private constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'QQ',
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // 只在首次初始化时验证
    this.transporter.verify((error) => {
      if (error) {
        console.error('邮件配置错误:', error)
      } else {
        console.log('邮件服务器连接成功')
      }
    })
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      console.log('正在发送邮件:', {
        from: process.env.EMAIL_FROM,
        to,
        subject,
      })

      const info = await this.transporter.sendMail({
        from: `"DayDo 系统" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      })

      console.log('邮件发送成功:', info)
    } catch (error) {
      console.error('邮件发送失败:', error)
      throw new ValidationError('邮件发送失败: ' + (error as Error).message)
    }
  }
}

const emailService = EmailService.getInstance()

export const sendEmail = (to: string, subject: string, html: string): Promise<void> => {
  return emailService.sendEmail(to, subject, html)
}

export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verificationUrl = `http://localhost:8000/verify-email?token=${token}`
  const html = `
    <h1>验证您的邮箱</h1>
    <p>请点击下面的链接验证您的邮箱：</p>
    <a href="${verificationUrl}">验证邮箱</a>
    <p>如果您没有注册账号，请忽略此邮件。</p>
  `
  await sendEmail(to, '验证您的邮箱', html)
}

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetUrl = `http://localhost:8000/reset-password?token=${token}`
  const html = `
    <h1>重置密码</h1>
    <p>请点击下面的链接进入重置密码页面：</p>
    <a href="${resetUrl}">重置密码</a>
    <p>如果您没有请求重置密码，请忽略此邮件。</p>
    <p>此链接将在1小时后失效。</p>
  `
  await sendEmail(to, '重置密码', html)
}
