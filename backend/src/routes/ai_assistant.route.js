import { Router } from 'express'

import { askAiAssistant } from '../controllers/ai_assistant.controller.js'
import { aiAssistantRateLimiter } from '../config/rate_limit.js'
import { validate } from '../middlewares/validate.js'
import { aiAssistantMessageSchema } from '../schemas/ai_assistant.schema.js'

const router = Router()

router.post('/', aiAssistantRateLimiter, validate(aiAssistantMessageSchema, 'body'), askAiAssistant)

export default router
