import { body } from 'express-validator'
import validateRequest from './validateRequest'

export const validateRegister = [
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  body('password').isLength({ min: 8 }).withMessage('密码至少8个字符'),
  validateRequest,
]

export const validateLogin = [
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  body('password').exists().withMessage('请提供密码'),
  validateRequest,
]

export const validateResetPassword = [
  body('token').exists().withMessage('请提供重置令牌'),
  body('password').isLength({ min: 8 }).withMessage('密码至少8个字符'),
  validateRequest,
]

export const updateProfileValidator = [
  body('email').optional().isEmail().withMessage('请提供有效的邮箱地址'),
  body('password').optional().isLength({ min: 8 }).withMessage('密码至少8个字符'),
  validateRequest,
]
