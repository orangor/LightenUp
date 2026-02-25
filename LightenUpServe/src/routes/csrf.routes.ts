import { Router } from 'express'
import { CsrfController } from '../controllers'

const router = Router()

// 获取 CSRF token
router.get('/csrf-token', CsrfController.getCsrfToken)

export default router
