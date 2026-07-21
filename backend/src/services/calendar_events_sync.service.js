import { pool } from '../config/db.js'
import {
  getConnectionByUserId,
  deleteConnectionByUserId,
} from './google_calendar_connections.service.js'
import {
  insertGoogleCalendarEvent,
  patchGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from './google_calendar.service.js'
import { getEventByIdAndUserId } from './calendar_events.service.js'

function isInvalidGrantError(error) {
  const message = error?.response?.data?.error ?? error?.message ?? ''
  return String(message).includes('invalid_grant')
}

// Google 對已刪除或不存在的事件回傳 404/410；此時舊的 google_event_id 已失效，需改建新事件
function isEventGoneError(error) {
  const status = error?.status ?? error?.response?.status
  return status === 404 || status === 410
}

async function setSyncState(eventId, { googleEventId, syncFailed }) {
  const result = await pool.query(
    `
      UPDATE calendar_events
      SET google_event_id = COALESCE($2, google_event_id), google_sync_failed = $3
      WHERE id = $1
      RETURNING *
    `,
    [eventId, googleEventId ?? null, syncFailed],
  )

  return result.rows[0] ?? null
}

export function createCalendarEventsSync({
  getConnectionByUserId,
  deleteConnectionByUserId,
  insertGoogleCalendarEvent,
  patchGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getEventByIdAndUserId,
  setSyncState,
}) {
  // 使用者從 Google 端撤銷授權時，刪除連接視同已中斷，避免之後每次同步都白打
  async function handleSyncError(userId, error) {
    console.error('Google 行事曆同步失敗:', error.message)

    if (isInvalidGrantError(error)) {
      await deleteConnectionByUserId(userId)
    }
  }

  async function pushEventToGoogle(connection, event) {
    if (event.google_event_id) {
      try {
        const status = await patchGoogleCalendarEvent(connection, event.google_event_id, event)
        // 使用者手動刪除的事件在 Google 端是 cancelled 墓碑，patch 不會報錯但也不會讓事件復活
        if (status !== 'cancelled') return event.google_event_id
      } catch (error) {
        if (!isEventGoneError(error)) throw error
      }
    }

    return insertGoogleCalendarEvent(connection, event)
  }

  async function syncCreatedEvent(userId, event) {
    try {
      const connection = await getConnectionByUserId(userId)
      if (!connection) return null

      const googleEventId = await insertGoogleCalendarEvent(connection, event)
      return await setSyncState(event.id, { googleEventId, syncFailed: false })
    } catch (error) {
      await handleSyncError(userId, error)
      return setSyncState(event.id, { syncFailed: true }).catch(() => null)
    }
  }

  async function syncUpdatedEvent(userId, event) {
    try {
      const connection = await getConnectionByUserId(userId)
      if (!connection) return null

      const googleEventId = await pushEventToGoogle(connection, event)
      return await setSyncState(event.id, { googleEventId, syncFailed: false })
    } catch (error) {
      await handleSyncError(userId, error)
      return setSyncState(event.id, { syncFailed: true }).catch(() => null)
    }
  }

  async function syncDeletedEvent(userId, googleEventId) {
    if (!googleEventId) return

    try {
      const connection = await getConnectionByUserId(userId)
      if (!connection) return

      await deleteGoogleCalendarEvent(connection, googleEventId)
    } catch (error) {
      // 本地行程已刪除，Google 端刪不掉只能記 log
      await handleSyncError(userId, error)
    }
  }

  // 刪除寵物前收集到的整批 google_event_id；單筆失敗仍繼續刪其餘
  async function syncDeletedEvents(userId, googleEventIds) {
    if (!googleEventIds || googleEventIds.length === 0) return

    try {
      const connection = await getConnectionByUserId(userId)
      if (!connection) return

      for (const googleEventId of googleEventIds) {
        try {
          await deleteGoogleCalendarEvent(connection, googleEventId)
        } catch (error) {
          await handleSyncError(userId, error)
        }
      }
    } catch (error) {
      await handleSyncError(userId, error)
    }
  }

  async function resyncEvent(userId, eventId) {
    const event = await getEventByIdAndUserId(eventId, userId)
    if (!event) return { status: 'not_found' }

    const connection = await getConnectionByUserId(userId)
    if (!connection) return { status: 'not_connected' }

    try {
      const googleEventId = await pushEventToGoogle(connection, event)
      const syncedEvent = await setSyncState(event.id, { googleEventId, syncFailed: false })
      return { status: 'synced', event: syncedEvent }
    } catch (error) {
      await handleSyncError(userId, error)
      await setSyncState(event.id, { syncFailed: true }).catch(() => null)
      return { status: 'failed' }
    }
  }

  return { syncCreatedEvent, syncUpdatedEvent, syncDeletedEvent, syncDeletedEvents, resyncEvent }
}

export const { syncCreatedEvent, syncUpdatedEvent, syncDeletedEvent, syncDeletedEvents, resyncEvent } =
  createCalendarEventsSync({
    getConnectionByUserId,
    deleteConnectionByUserId,
    insertGoogleCalendarEvent,
    patchGoogleCalendarEvent,
    deleteGoogleCalendarEvent,
    getEventByIdAndUserId,
    setSyncState,
  })
