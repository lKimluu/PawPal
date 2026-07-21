import { google } from 'googleapis'

// 前端以彈出視窗取得授權碼（非整頁跳轉），Google 規定此流程的 redirect_uri 固定為 'postmessage'
const POPUP_REDIRECT_URI = 'postmessage'

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    POPUP_REDIRECT_URI,
  )
}

export async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  return {
    access_token: tokens.access_token ?? null,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: tokens.expiry_date ?? null,
    scope: tokens.scope ?? '',
  }
}

export async function revokeGoogleToken(token) {
  if (!token) {
    return
  }

  try {
    const oauth2Client = createOAuth2Client()
    await oauth2Client.revokeToken(token)
  } catch (error) {
    // 撤銷是盡力而為（token 可能早已失效），失敗不影響主流程
    console.error('Google token 撤銷失敗:', error.message)
  }
}

const SYNC_TIME_ZONE = 'Asia/Taipei'
const EVENT_DURATION_MS = 60 * 60 * 1000

// pg 的 DATE 欄位回傳 JS Date 物件；用本地時間組字串，避免 toISOString 的 UTC 偏移
function toDateString(value) {
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return String(value)
}

function toLocalDateTimeString(date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${toDateString(date)}T${hours}:${minutes}:${seconds}`
}

export function buildGoogleEventPayload(event) {
  const payload = {
    summary: event.title,
    ...(event.location && { location: event.location }),
    ...(event.notes && { description: event.notes }),
  }

  const dateString = toDateString(event.event_date)

  // patch 是欄位合併：date 與 dateTime 擇一使用時，須將另一個明確設為 null 清除，
  // 否則行程在「全天 ↔ 有時間」間切換後，合併結果兩者並存會被 Google 拒絕（Invalid start time）
  if (event.event_time) {
    const time = event.event_time.length === 5 ? `${event.event_time}:00` : event.event_time
    const start = new Date(`${dateString}T${time}`)
    const end = new Date(start.getTime() + EVENT_DURATION_MS)

    payload.start = { dateTime: toLocalDateTimeString(start), timeZone: SYNC_TIME_ZONE, date: null }
    payload.end = { dateTime: toLocalDateTimeString(end), timeZone: SYNC_TIME_ZONE, date: null }
  } else {
    // Google 全天事件的結束日為「不含」的隔天
    const nextDay = new Date(`${dateString}T00:00:00`)
    nextDay.setDate(nextDay.getDate() + 1)

    payload.start = { date: dateString, dateTime: null }
    payload.end = { date: toDateString(nextDay), dateTime: null }
  }

  return payload
}

// googleapis 拿到 refresh token 後，access token 過期會自動換新
function createCalendarClient(connection) {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    refresh_token: connection.google_refresh_token,
    access_token: connection.google_access_token ?? undefined,
    expiry_date: connection.access_token_expires_at
      ? new Date(connection.access_token_expires_at).getTime()
      : undefined,
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function insertGoogleCalendarEvent(connection, event) {
  const calendar = createCalendarClient(connection)
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: buildGoogleEventPayload(event),
  })

  return response.data.id
}

// 使用者手動刪除的事件在 Google 端只是標記為 cancelled 的墓碑記錄，patch 對它不會報錯而是直接回 200，
// 所以呼叫端必須另外檢查回傳的 status 是否為 cancelled，藉此判斷這顆 google_event_id 是否已經失效
export async function patchGoogleCalendarEvent(connection, googleEventId, event) {
  const calendar = createCalendarClient(connection)
  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: buildGoogleEventPayload(event),
  })

  return response.data.status
}

export async function deleteGoogleCalendarEvent(connection, googleEventId) {
  const calendar = createCalendarClient(connection)
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  })
}
