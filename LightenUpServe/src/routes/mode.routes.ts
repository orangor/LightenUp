import { Router } from 'express'
import { ModeController } from '../controllers'
import { streamMiddleware } from '../middleware/stream.middleware'

const router = Router()

// 获取 CSRF token
router.post('/chat-stream', ...streamMiddleware, ModeController.chatStream)

export default router
