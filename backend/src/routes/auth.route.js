import { Router } from 'express'
import { register, login, googleLogin } from '../controllers/auth.controller.js'
import { validate } from '../middlewares/validate.js'
import { loginSchema, registerSchema, googleLoginSchema } from '../schemas/auth.schema.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/google-login', validate(googleLoginSchema), googleLogin)

export default router
