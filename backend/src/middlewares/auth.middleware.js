import jwt from 'jsonwebtoken'

function getBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return null
  }

  const match = authorizationHeader.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] ?? null
}

export function authenticateToken(req, res, next) {
  const token = getBearerToken(req.headers.authorization)
  const jwtSecret = process.env.JWT_SECRET

  if (!token || !jwtSecret) {
    return res.status(401).json({ message: '未授權，請重新登入' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    const userId = Number(payload.sub)

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: '未授權，請重新登入' })
    }

    req.userId = userId
    return next()
  } catch {
    return res.status(401).json({ message: '未授權，請重新登入' })
  }
}

export function attachUserIfPresent(req, _res, next) {
  const token = getBearerToken(req.headers.authorization)
  const jwtSecret = process.env.JWT_SECRET

  if (!token || !jwtSecret) {
    return next()
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    const userId = Number(payload.sub)

    if (Number.isSafeInteger(userId) && userId > 0) {
      req.userId = userId
    }
  } catch {
    // Invalid or expired token: treat the caller as anonymous instead of rejecting the request.
  }

  return next()
}
