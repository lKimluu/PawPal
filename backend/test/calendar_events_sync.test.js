import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildGoogleEventPayload } from '../src/services/google_calendar.service.js'
import { createCalendarEventsSync } from '../src/services/calendar_events_sync.service.js'
import { createResyncCalendarEvent } from '../src/controllers/calendar_events.controller.js'

const connection = { id: 1, user_id: 42, google_refresh_token: 'refresh-token' }

function notImplemented(name) {
  return async () => {
    throw new Error(`${name} should not be called`)
  }
}

function createSync(overrides = {}) {
  return createCalendarEventsSync({
    getConnectionByUserId: notImplemented('getConnectionByUserId'),
    deleteConnectionByUserId: notImplemented('deleteConnectionByUserId'),
    insertGoogleCalendarEvent: notImplemented('insertGoogleCalendarEvent'),
    patchGoogleCalendarEvent: notImplemented('patchGoogleCalendarEvent'),
    deleteGoogleCalendarEvent: notImplemented('deleteGoogleCalendarEvent'),
    getEventByIdAndUserId: notImplemented('getEventByIdAndUserId'),
    setSyncState: notImplemented('setSyncState'),
    ...overrides,
  })
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

// --- buildGoogleEventPayload ---

test('payload：有時間的行程應為 1 小時的 Asia/Taipei 事件', () => {
  const payload = buildGoogleEventPayload({
    title: '打疫苗',
    event_date: '2026-07-15',
    event_time: '14:30',
    location: '毛毛動物醫院',
    notes: '記得帶手冊',
  })

  assert.equal(payload.summary, '打疫苗')
  assert.equal(payload.location, '毛毛動物醫院')
  assert.equal(payload.description, '記得帶手冊')
  assert.deepEqual(payload.start, {
    dateTime: '2026-07-15T14:30:00',
    timeZone: 'Asia/Taipei',
    date: null,
  })
  assert.deepEqual(payload.end, {
    dateTime: '2026-07-15T15:30:00',
    timeZone: 'Asia/Taipei',
    date: null,
  })
})

test('payload：23:30 的行程結束時間應跨到隔天', () => {
  const payload = buildGoogleEventPayload({
    title: '吃藥',
    event_date: '2026-07-15',
    event_time: '23:30:00',
  })

  assert.equal(payload.start.dateTime, '2026-07-15T23:30:00')
  assert.equal(payload.end.dateTime, '2026-07-16T00:30:00')
})

test('payload：沒有時間的行程應為全天事件且結束日為隔天', () => {
  const payload = buildGoogleEventPayload({
    title: '洗澡',
    event_date: '2026-07-31',
    event_time: null,
  })

  assert.deepEqual(payload.start, { date: '2026-07-31', dateTime: null })
  assert.deepEqual(payload.end, { date: '2026-08-01', dateTime: null })
})

test('payload：event_date 為 pg 的 Date 物件時應正確轉為本地日期字串', () => {
  const payload = buildGoogleEventPayload({
    title: '回診',
    event_date: new Date(2026, 6, 15), // 本地時間 2026-07-15
    event_time: '09:00',
  })

  assert.equal(payload.start.dateTime, '2026-07-15T09:00:00')
})

test('payload：沒有 location 與 notes 時不應帶出對應欄位', () => {
  const payload = buildGoogleEventPayload({
    title: '美容',
    event_date: '2026-07-15',
    event_time: '10:00',
    location: null,
    notes: null,
  })

  assert.equal('location' in payload, false)
  assert.equal('description' in payload, false)
})

// --- syncCreatedEvent ---

test('syncCreated：未連接時不動作並回傳 null', async () => {
  const { syncCreatedEvent } = createSync({
    getConnectionByUserId: async () => null,
  })

  const result = await syncCreatedEvent(42, { id: 7, title: '打疫苗' })

  assert.equal(result, null)
})

test('syncCreated：成功時應寫回 google_event_id 並清除失敗標記', async () => {
  const stateCalls = []
  const { syncCreatedEvent } = createSync({
    getConnectionByUserId: async () => connection,
    insertGoogleCalendarEvent: async () => 'google-event-9',
    setSyncState: async (eventId, state) => {
      stateCalls.push([eventId, state])
      return { id: 7, google_event_id: 'google-event-9', google_sync_failed: false }
    },
  })

  const result = await syncCreatedEvent(42, { id: 7, title: '打疫苗' })

  assert.deepEqual(stateCalls, [[7, { googleEventId: 'google-event-9', syncFailed: false }]])
  assert.equal(result.google_event_id, 'google-event-9')
})

test('syncCreated：Google 失敗時應標記 google_sync_failed 且不 throw', async (t) => {
  t.mock.method(console, 'error', () => {})
  const stateCalls = []
  const { syncCreatedEvent } = createSync({
    getConnectionByUserId: async () => connection,
    insertGoogleCalendarEvent: async () => {
      throw new Error('Google API error')
    },
    setSyncState: async (eventId, state) => {
      stateCalls.push([eventId, state])
      return { id: 7, google_sync_failed: true }
    },
  })

  const result = await syncCreatedEvent(42, { id: 7, title: '打疫苗' })

  assert.deepEqual(stateCalls, [[7, { syncFailed: true }]])
  assert.equal(result.google_sync_failed, true)
})

test('syncCreated：invalid_grant 錯誤應刪除連接', async (t) => {
  t.mock.method(console, 'error', () => {})
  const deletedUserIds = []
  const { syncCreatedEvent } = createSync({
    getConnectionByUserId: async () => connection,
    insertGoogleCalendarEvent: async () => {
      const error = new Error('invalid_grant')
      throw error
    },
    deleteConnectionByUserId: async (userId) => {
      deletedUserIds.push(userId)
    },
    setSyncState: async () => ({ id: 7, google_sync_failed: true }),
  })

  await syncCreatedEvent(42, { id: 7, title: '打疫苗' })

  assert.deepEqual(deletedUserIds, [42])
})

// --- syncUpdatedEvent ---

test('syncUpdated：已有 google_event_id 應走 patch', async () => {
  const patchCalls = []
  const { syncUpdatedEvent } = createSync({
    getConnectionByUserId: async () => connection,
    patchGoogleCalendarEvent: async (conn, googleEventId) => {
      patchCalls.push(googleEventId)
    },
    setSyncState: async () => ({ id: 7, google_event_id: 'google-event-9' }),
  })

  await syncUpdatedEvent(42, { id: 7, google_event_id: 'google-event-9', title: '複診' })

  assert.deepEqual(patchCalls, ['google-event-9'])
})

test('syncUpdated：沒有 google_event_id 應改走 insert 補同步', async () => {
  const insertCalls = []
  const { syncUpdatedEvent } = createSync({
    getConnectionByUserId: async () => connection,
    insertGoogleCalendarEvent: async (conn, event) => {
      insertCalls.push(event.id)
      return 'google-event-new'
    },
    setSyncState: async (eventId, state) => ({ id: eventId, google_event_id: state.googleEventId }),
  })

  const result = await syncUpdatedEvent(42, { id: 7, google_event_id: null, title: '複診' })

  assert.deepEqual(insertCalls, [7])
  assert.equal(result.google_event_id, 'google-event-new')
})

// --- syncDeletedEvent ---

test('syncDeleted：有 google_event_id 且已連接應刪除 Google 事件', async () => {
  const deleteCalls = []
  const { syncDeletedEvent } = createSync({
    getConnectionByUserId: async () => connection,
    deleteGoogleCalendarEvent: async (conn, googleEventId) => {
      deleteCalls.push(googleEventId)
    },
  })

  await syncDeletedEvent(42, 'google-event-9')

  assert.deepEqual(deleteCalls, ['google-event-9'])
})

test('syncDeleted：沒有 google_event_id 時不查連接也不動作', async () => {
  const { syncDeletedEvent } = createSync()

  await syncDeletedEvent(42, null)
})

test('syncDeleted：Google 失敗只記 log 不 throw', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { syncDeletedEvent } = createSync({
    getConnectionByUserId: async () => connection,
    deleteGoogleCalendarEvent: async () => {
      throw new Error('Google API error')
    },
  })

  await syncDeletedEvent(42, 'google-event-9')
})

// --- resyncEvent ---

test('resync：行程不存在應回 not_found', async () => {
  const { resyncEvent } = createSync({
    getEventByIdAndUserId: async () => null,
  })

  const result = await resyncEvent(42, '99')

  assert.deepEqual(result, { status: 'not_found' })
})

test('resync：未連接應回 not_connected', async () => {
  const { resyncEvent } = createSync({
    getEventByIdAndUserId: async () => ({ id: 7, title: '打疫苗' }),
    getConnectionByUserId: async () => null,
  })

  const result = await resyncEvent(42, '7')

  assert.deepEqual(result, { status: 'not_connected' })
})

test('resync：成功應回 synced 與更新後行程', async () => {
  const { resyncEvent } = createSync({
    getEventByIdAndUserId: async () => ({ id: 7, google_event_id: null, title: '打疫苗' }),
    getConnectionByUserId: async () => connection,
    insertGoogleCalendarEvent: async () => 'google-event-9',
    setSyncState: async () => ({ id: 7, google_event_id: 'google-event-9', google_sync_failed: false }),
  })

  const result = await resyncEvent(42, '7')

  assert.equal(result.status, 'synced')
  assert.equal(result.event.google_event_id, 'google-event-9')
})

test('resync：Google 失敗應回 failed 並標記行程', async (t) => {
  t.mock.method(console, 'error', () => {})
  const stateCalls = []
  const { resyncEvent } = createSync({
    getEventByIdAndUserId: async () => ({ id: 7, google_event_id: 'google-event-9', title: '打疫苗' }),
    getConnectionByUserId: async () => connection,
    patchGoogleCalendarEvent: async () => {
      throw new Error('Google API error')
    },
    setSyncState: async (eventId, state) => {
      stateCalls.push([eventId, state])
      return { id: 7 }
    },
  })

  const result = await resyncEvent(42, '7')

  assert.deepEqual(result, { status: 'failed' })
  assert.deepEqual(stateCalls, [[7, { syncFailed: true }]])
})

// --- resync controller ---

test('resync controller：not_found 應回 404', async () => {
  const resyncCalendarEvent = createResyncCalendarEvent({
    resyncEvent: async () => ({ status: 'not_found' }),
  })
  const res = createResponse()

  await resyncCalendarEvent({ params: { id: '99' }, userId: 42 }, res)

  assert.equal(res.statusCode, 404)
})

test('resync controller：not_connected 應回 400', async () => {
  const resyncCalendarEvent = createResyncCalendarEvent({
    resyncEvent: async () => ({ status: 'not_connected' }),
  })
  const res = createResponse()

  await resyncCalendarEvent({ params: { id: '7' }, userId: 42 }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, '尚未連接 Google 行事曆')
})

test('resync controller：failed 應回 500', async () => {
  const resyncCalendarEvent = createResyncCalendarEvent({
    resyncEvent: async () => ({ status: 'failed' }),
  })
  const res = createResponse()

  await resyncCalendarEvent({ params: { id: '7' }, userId: 42 }, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.message, '重新同步失敗，請稍後再試')
})

test('resync controller：synced 應回 200 與行程資料', async () => {
  const syncedEvent = { id: 7, google_event_id: 'google-event-9', google_sync_failed: false }
  const resyncCalendarEvent = createResyncCalendarEvent({
    resyncEvent: async () => ({ status: 'synced', event: syncedEvent }),
  })
  const res = createResponse()

  await resyncCalendarEvent({ params: { id: '7' }, userId: 42 }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { message: '重新同步成功', data: syncedEvent })
})

// --- syncDeletedEvents（刪除寵物的批次清理）---

test('syncDeletedEvents：空陣列時不查連接也不動作', async () => {
  const { syncDeletedEvents } = createSync()

  await syncDeletedEvents(42, [])
})

test('syncDeletedEvents：未連接時不打 Google', async () => {
  const { syncDeletedEvents } = createSync({
    getConnectionByUserId: async () => null,
  })

  await syncDeletedEvents(42, ['google-event-1'])
})

test('syncDeletedEvents：應逐筆刪除且單筆失敗仍繼續', async (t) => {
  t.mock.method(console, 'error', () => {})
  const deleteCalls = []
  const { syncDeletedEvents } = createSync({
    getConnectionByUserId: async () => connection,
    deleteGoogleCalendarEvent: async (conn, googleEventId) => {
      deleteCalls.push(googleEventId)
      if (googleEventId === 'google-event-1') {
        throw new Error('Google API error')
      }
    },
  })

  await syncDeletedEvents(42, ['google-event-1', 'google-event-2'])

  assert.deepEqual(deleteCalls, ['google-event-1', 'google-event-2'])
})
