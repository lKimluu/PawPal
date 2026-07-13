import { Router } from 'express'

import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
} from '../controllers/google_calendar_connections.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { connectGoogleCalendarSchema } from '../schemas/google_calendar_connections.schema.js'

const router = Router()

router.get('/status', authenticateToken, getGoogleCalendarStatus)
router.post('/connect', authenticateToken, validate(connectGoogleCalendarSchema), connectGoogleCalendar)
router.delete('/disconnect', authenticateToken, disconnectGoogleCalendar)

export default router
