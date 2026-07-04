import { rateLimit } from 'express-rate-limit'

const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const DEFAULT_RATE_LIMIT_MAX = 100

function readPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? '', 10)

  return Number.isInteger(value) && value > 0 ? value : fallback
}

export const apiRateLimitOptions = {
  windowMs: readPositiveIntegerEnv('RATE_LIMIT_WINDOW_MS', DEFAULT_RATE_LIMIT_WINDOW_MS),
  limit: readPositiveIntegerEnv('RATE_LIMIT_MAX', DEFAULT_RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      message: '請求過於頻繁，請稍後再試',
    })
  },
}

export const apiRateLimiter = rateLimit(apiRateLimitOptions)
