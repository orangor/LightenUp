import { Router } from 'express'
import { UserController } from '../controllers'
import validateRequest from '../middleware/validateRequest'
import { updateProfileValidator } from '../middleware/validators'
const router = Router()
// 判定用户认证

// 用户路由
router.get('/profile', UserController.getProfile)
router.put('/profile', updateProfileValidator, validateRequest, UserController.updateProfile)
router.delete('/account', UserController.deleteAccount)

export default router
