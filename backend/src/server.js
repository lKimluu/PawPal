import dotenv from 'dotenv'

dotenv.config()

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'LINE_CHANNEL_ID',
  'LINE_CHANNEL_SECRET',
  'LINE_REDIRECT_URI',
  'GEMINI_API_KEY',
]

const missingEnvVars = requiredEnvVars.filter((envVar) => {
  const value = process.env[envVar]
  return typeof value !== 'string' || value.trim() === ''
})

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:')

  missingEnvVars.forEach((envVar) => {
    console.error(`- ${envVar}`)
  })

  console.error('Please check your backend/.env file before starting the server.')
  process.exit(1)
}

const PORT = process.env.PORT || 3000
const { default: app } = await import('./app.js')

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
