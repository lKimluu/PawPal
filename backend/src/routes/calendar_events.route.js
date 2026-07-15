import { Router } from 'express'

import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  resyncCalendarEvent,
} from '../controllers/calendar_events.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import {
  calendarEventParamsSchema,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from '../schemas/calendar_events.schema.js'

const router = Router()

router.get('/', authenticateToken, getCalendarEvents)
router.post('/', authenticateToken, validate(createCalendarEventSchema), createCalendarEvent)
router.patch('/:id', authenticateToken, validate(calendarEventParamsSchema, 'params'), validate(updateCalendarEventSchema), updateCalendarEvent)
router.delete('/:id', authenticateToken, validate(calendarEventParamsSchema, 'params'), deleteCalendarEvent)
router.post('/:id/resync', authenticateToken, validate(calendarEventParamsSchema, 'params'), resyncCalendarEvent)

export default router
