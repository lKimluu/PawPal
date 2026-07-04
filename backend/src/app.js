import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import userRoutes from './routes/users.route.js'
import authRoutes from './routes/auth.route.js'
import calendarEventRoutes from './routes/calendar_events.route.js'
import growthRecordsRoutes from './routes/growth_records.route.js'
import petRoutes from './routes/pets.route.js'
import medicalRecordRoutes from './routes/medical_records.route.js'
import { apiRateLimiter } from './config/rate_limit.js'

const app = express()
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const API_PREFIX = '/api/v1'

app.use(helmet())
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
  }),
)
app.use(express.json())
app.use(API_PREFIX, apiRateLimiter)
app.use(`${API_PREFIX}/users`, userRoutes)
app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/calendar-events`, calendarEventRoutes)
app.use(`${API_PREFIX}/growth-records`, growthRecordsRoutes)
app.use(`${API_PREFIX}/pets`, petRoutes)
app.use(`${API_PREFIX}/medical-records`, medicalRecordRoutes)

app.get('/', (req, res) => {
  res.json({
    message: 'PawPal Backend Running',
  })
})

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      message: 'Invalid JSON format',
    })
  }

  console.error(error)

  return res.status(500).json({
    message: 'Internal server error',
  })
})

export default app
