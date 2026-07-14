import {
  getConnectionByUserId,
  upsertConnection,
  updateAccessToken,
  deleteConnectionByUserId,
} from '../services/google_calendar_connections.service.js'
import { exchangeCodeForTokens, revokeGoogleToken } from '../services/google_calendar.service.js'

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

function hasCalendarScope(scope) {
  return scope.split(/\s+/).includes(CALENDAR_EVENTS_SCOPE)
}

function toExpiresAt(expiryDate) {
  return expiryDate ? new Date(expiryDate) : null
}

export function createConnectGoogleCalendar({
  exchangeCodeForTokens,
  revokeGoogleToken,
  getConnectionByUserId,
  upsertConnection,
  updateAccessToken,
}) {
  return async function connectGoogleCalendar(req, res) {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: '未授權，請重新登入' })

    const { code } = req.body

    let tokens
    try {
      tokens = await exchangeCodeForTokens(code)
    } catch (error) {
      console.error('Google 授權碼兌換失敗:', error.message)
      return res.status(401).json({ message: 'Google 授權已失效，請重新連接' })
    }

    try {
      if (!hasCalendarScope(tokens.scope)) {
        return res.status(400).json({ message: '請在 Google 授權畫面勾選行事曆權限後重試' })
      }

      if (tokens.refresh_token) {
        await upsertConnection({
          userId,
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          expiresAt: toExpiresAt(tokens.expiry_date),
        })

        return res.status(200).json({
          message: 'Google 行事曆連接成功',
          data: { connected: true },
        })
      }

      // Google 只在使用者首次同意時核發 refresh token；沒拿到時沿用既有連接的舊 token
      const existingConnection = await getConnectionByUserId(userId)

      if (existingConnection) {
        await updateAccessToken({
          userId,
          accessToken: tokens.access_token,
          expiresAt: toExpiresAt(tokens.expiry_date),
        })

        return res.status(200).json({
          message: 'Google 行事曆連接成功',
          data: { connected: true },
        })
      }

      // 無 refresh token 也無舊連接：撤銷這次授權，讓使用者重試時能重新走完整同意流程
      await revokeGoogleToken(tokens.access_token)

      return res.status(400).json({ message: '連接發生問題，請再點一次連接' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Google 行事曆連接失敗，請稍後再試' })
    }
  }
}

export function createDisconnectGoogleCalendar({
  getConnectionByUserId,
  revokeGoogleToken,
  deleteConnectionByUserId,
}) {
  return async function disconnectGoogleCalendar(req, res) {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: '未授權，請重新登入' })

    try {
      const connection = await getConnectionByUserId(userId)

      if (connection) {
        await revokeGoogleToken(connection.google_refresh_token)
        await deleteConnectionByUserId(userId)
      }

      return res.status(200).json({ message: '已中斷 Google 行事曆連接' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: '中斷 Google 行事曆連接失敗，請稍後再試' })
    }
  }
}

export function createGetGoogleCalendarStatus({ getConnectionByUserId }) {
  return async function getGoogleCalendarStatus(req, res) {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: '未授權，請重新登入' })

    try {
      const connection = await getConnectionByUserId(userId)

      return res.status(200).json({ data: { connected: Boolean(connection) } })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: '查詢 Google 行事曆連接狀態失敗' })
    }
  }
}

export const connectGoogleCalendar = createConnectGoogleCalendar({
  exchangeCodeForTokens,
  revokeGoogleToken,
  getConnectionByUserId,
  upsertConnection,
  updateAccessToken,
})

export const disconnectGoogleCalendar = createDisconnectGoogleCalendar({
  getConnectionByUserId,
  revokeGoogleToken,
  deleteConnectionByUserId,
})

export const getGoogleCalendarStatus = createGetGoogleCalendarStatus({
  getConnectionByUserId,
})
