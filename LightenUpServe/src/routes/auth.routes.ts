import { Router } from 'express'
import { AuthController } from '../controllers'
import { validateLogin, validateRegister, validateResetPassword } from '../middleware/validators'

const router = Router()

router.post('/register', validateRegister, AuthController.register)
router.post('/login', validateLogin, AuthController.login)
router.get('/verify-email', AuthController.verifyEmail)
router.post('/forgot-password', AuthController.forgotPassword)
router.post('/reset-password', validateResetPassword, AuthController.resetPassword)

export default router
