import { Router } from 'express'
import { register, login, googleLogin, lineLogin } from '../controllers/auth.controller.js'
import { authIpRateLimiter, authRateLimiter } from '../config/rate_limit.js'
import { validate } from '../middlewares/validate.js'
import {
  loginSchema,
  registerSchema,
  googleLoginSchema,
  lineLoginSchema,
} from '../schemas/auth.schema.js'

const router = Router()

router.post('/register', authIpRateLimiter, authRateLimiter, validate(registerSchema), register)
router.post('/login', authIpRateLimiter, authRateLimiter, validate(loginSchema), login)
router.post('/google-login', authIpRateLimiter, authRateLimiter, validate(googleLoginSchema), googleLogin)
router.post('/line-login', authIpRateLimiter, authRateLimiter, validate(lineLoginSchema), lineLogin)

export default router
