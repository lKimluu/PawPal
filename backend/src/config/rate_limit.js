import { ipKeyGenerator, rateLimit } from 'express-rate-limit'

const RATE_LIMIT_MESSAGE = '請求過於頻繁，請稍後再試'
const CLIENT_ID_HEADER = 'x-pawpal-client-id'
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readPositiveIntegerEnv(names, fallback) {
  for (const name of names) {
    const value = Number(process.env[name] ?? '')

    if (Number.isInteger(value) && value > 0) {
      return value
    }
  }

  return fallback
}

function rateLimitHandler(req, res) {
  return res.status(429).json({
    message: RATE_LIMIT_MESSAGE,
  })
}

function createRateLimitOptions({ windowMs, limit, skip, keyGenerator }) {
  return {
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    ...(skip ? { skip } : {}),
    ...(keyGenerator ? { keyGenerator } : {}),
  }
}

function readClientId(req) {
  const value = req.headers?.[CLIENT_ID_HEADER]

  return typeof value === 'string' && UUID_V4_PATTERN.test(value) ? value.toLowerCase() : null
}

function createClientAwareKeyGenerator(namespace) {
  return (req) => {
    const ip = ipKeyGenerator(req.ip)
    const clientId = readClientId(req)

    return clientId ? `${namespace}:client:${ip}:${clientId}` : `${namespace}:ip:${ip}`
  }
}

function createIpKeyGenerator(namespace) {
  return (req) => `${namespace}:ip:${ipKeyGenerator(req.ip)}`
}

const dedicatedRateLimitRequests = new Set([
  'GET /hospitals/map',
  'POST /auth/register',
  'POST /auth/login',
  'POST /auth/google-login',
  'POST /auth/line-login',
])

function normalizeRoutePath(path) {
  const normalizedPath = path.toLowerCase()
  return normalizedPath.length > 1 ? normalizedPath.replace(/\/$/, '') : normalizedPath
}

export const generalApiRateLimitOptions = createRateLimitOptions({
  windowMs: readPositiveIntegerEnv(
    ['GENERAL_API_RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_WINDOW_MS'],
    15 * 60 * 1000,
  ),
  limit: readPositiveIntegerEnv(['GENERAL_API_RATE_LIMIT_MAX', 'RATE_LIMIT_MAX'], 600),
  skip: (req) =>
    dedicatedRateLimitRequests.has(`${req.method} ${normalizeRoutePath(req.path)}`),
})

export const generalApiRateLimiter = rateLimit(generalApiRateLimitOptions)

export const hospitalMapRateLimitOptions = createRateLimitOptions({
  windowMs: readPositiveIntegerEnv(['HOSPITAL_MAP_RATE_LIMIT_WINDOW_MS'], 60 * 1000),
  limit: readPositiveIntegerEnv(['HOSPITAL_MAP_RATE_LIMIT_MAX'], 60),
  keyGenerator: createClientAwareKeyGenerator('hospital-map'),
})

export const hospitalMapRateLimiter = rateLimit(hospitalMapRateLimitOptions)

export const hospitalMapIpRateLimitOptions = createRateLimitOptions({
  windowMs: readPositiveIntegerEnv(['HOSPITAL_MAP_IP_RATE_LIMIT_WINDOW_MS'], 60 * 1000),
  limit: readPositiveIntegerEnv(['HOSPITAL_MAP_IP_RATE_LIMIT_MAX'], 600),
  keyGenerator: createIpKeyGenerator('hospital-map-ceiling'),
})

export const hospitalMapIpRateLimiter = rateLimit(hospitalMapIpRateLimitOptions)

export const authRateLimitOptions = createRateLimitOptions({
  windowMs: readPositiveIntegerEnv(['AUTH_RATE_LIMIT_WINDOW_MS'], 15 * 60 * 1000),
  limit: readPositiveIntegerEnv(['AUTH_RATE_LIMIT_MAX'], 10),
  keyGenerator: createClientAwareKeyGenerator('auth'),
})

export const authRateLimiter = rateLimit(authRateLimitOptions)

export const authIpRateLimitOptions = createRateLimitOptions({
  windowMs: readPositiveIntegerEnv(['AUTH_IP_RATE_LIMIT_WINDOW_MS'], 15 * 60 * 1000),
  limit: readPositiveIntegerEnv(['AUTH_IP_RATE_LIMIT_MAX'], 100),
  keyGenerator: createIpKeyGenerator('auth-ceiling'),
})

export const authIpRateLimiter = rateLimit(authIpRateLimitOptions)

export const aiAssistantRateLimitOptions = createRateLimitOptions({
  windowMs: readPositiveIntegerEnv(['AI_RATE_LIMIT_WINDOW_MS'], 60 * 1000),
  limit: readPositiveIntegerEnv(['AI_RATE_LIMIT_MAX'], 10),
})

export const aiAssistantRateLimiter = rateLimit(aiAssistantRateLimitOptions)
