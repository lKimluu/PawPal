import { Router } from 'express'

import { getCurrentUser, updateCurrentUser } from '../controllers/users.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { updateCurrentUserSchema } from '../schemas/users.schema.js'

const router = Router()

router.get('/me', authenticateToken, getCurrentUser)
router.patch('/me', authenticateToken, validate(updateCurrentUserSchema), updateCurrentUser)

export default router
