import { Router } from 'express'
import { register, login, googleLogin, lineLogin } from '../controllers/auth.controller.js'
import { validate } from '../middlewares/validate.js'
import {
  loginSchema,
  registerSchema,
  googleLoginSchema,
  lineLoginSchema,
} from '../schemas/auth.schema.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/google-login', validate(googleLoginSchema), googleLogin)
router.post('/line-login', validate(lineLoginSchema), lineLogin)

export default router
