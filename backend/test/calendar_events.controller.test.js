import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createGetCalendarEvents,
  createCreateCalendarEvent,
  createUpdateCalendarEvent,
  createDeleteCalendarEvent,
} from '../src/controllers/calendar_events.controller.js'

function createRes() {
  return {
    statusCode: null,
    body: null,
    sent: false,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    send() {
      this.sent = true
      return this
    },
  }
}

// GET /
test('取得行事曆行程：成功回傳 events 陣列', async () => {
  const events = [
    { id: 1, title: '回診', type: 'vet', event_date: '2026-07-01' },
    { id: 2, title: '洗澡', type: 'bath', event_date: '2026-07-05' },
  ]
  const getCalendarEvents = createGetCalendarEvents({
    getEventsByUserId: async (userId) => {
      assert.equal(userId, 1)
      return events
    },
  })

  const req = { userId: 1 }
  const res = createRes()
  await getCalendarEvents(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { data: events })
})

test('取得行事曆行程失敗時應回傳 500', async (t) => {
  t.mock.method(console, 'error', () => {})
  const getCalendarEvents = createGetCalendarEvents({
    getEventsByUserId: async () => {
      throw new Error('DB error')
    },
  })

  const req = { userId: 1 }
  const res = createRes()
  await getCalendarEvents(req, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '取得行事曆行程失敗' })
})

// POST /
test('新增行事曆行程：成功回傳 201 與新資料', async () => {
  const newEvent = {
    id: 3,
    pet_id: 1,
    title: '施打疫苗',
    type: 'vaccine',
    event_date: '2026-07-10',
  }
  const createCalendarEvent = createCreateCalendarEvent({
    createEvent: async (data) => {
      assert.equal(data.pet_id, 1)
      assert.equal(data.title, '施打疫苗')
      return newEvent
    },
  })

  const req = {
    userId: 1,
    body: { pet_id: 1, title: '施打疫苗', event_date: '2026-07-10', type: 'vaccine' },
  }
  const res = createRes()
  await createCalendarEvent(req, res)

  assert.equal(res.statusCode, 201)
  assert.deepEqual(res.body, { message: '行事曆行程新增成功', data: newEvent })
})

test('新增行事曆行程失敗時應回傳 500', async (t) => {
  t.mock.method(console, 'error', () => {})
  const createCalendarEvent = createCreateCalendarEvent({
    createEvent: async () => {
      throw new Error('DB error')
    },
  })

  const req = {
    userId: 1,
    body: { pet_id: 1, title: '施打疫苗', event_date: '2026-07-10', type: 'vaccine' },
  }
  const res = createRes()
  await createCalendarEvent(req, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '新增行事曆行程失敗' })
})

// PATCH /:id
test('更新行事曆行程：成功回傳 200 與更新後資料', async () => {
  const updated = { id: 1, title: '複診', type: 'vet', event_date: '2026-07-15' }
  const updateCalendarEvent = createUpdateCalendarEvent({
    updateEvent: async (id, fields, userId) => {
      assert.equal(id, '1')
      assert.equal(userId, 2)
      assert.deepEqual(fields, { title: '複診' })
      return updated
    },
  })

  const req = { params: { id: '1' }, userId: 2, body: { title: '複診' } }
  const res = createRes()
  await updateCalendarEvent(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { message: '行事曆行程更新成功', data: updated })
})

test('更新行事曆行程：找不到行程時應回傳 404', async () => {
  const updateCalendarEvent = createUpdateCalendarEvent({
    updateEvent: async () => null,
  })

  const req = { params: { id: '99' }, userId: 2, body: { title: '複診' } }
  const res = createRes()
  await updateCalendarEvent(req, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到此行事曆行程' })
})

test('更新行事曆行程失敗時應回傳 500', async (t) => {
  t.mock.method(console, 'error', () => {})
  const updateCalendarEvent = createUpdateCalendarEvent({
    updateEvent: async () => {
      throw new Error('DB error')
    },
  })

  const req = { params: { id: '1' }, userId: 2, body: { title: '複診' } }
  const res = createRes()
  await updateCalendarEvent(req, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '更新行事曆行程失敗' })
})

// DELETE /:id
test('刪除行事曆行程：成功回傳 204', async () => {
  const deleteCalendarEvent = createDeleteCalendarEvent({
    deleteEvent: async (id, userId) => {
      assert.equal(id, '1')
      assert.equal(userId, 2)
      return { id: 1 }
    },
  })

  const req = { params: { id: '1' }, userId: 2 }
  const res = createRes()
  await deleteCalendarEvent(req, res)

  assert.equal(res.statusCode, 204)
  assert.equal(res.sent, true)
})

test('刪除行事曆行程：找不到行程時應回傳 404', async () => {
  const deleteCalendarEvent = createDeleteCalendarEvent({
    deleteEvent: async () => null,
  })

  const req = { params: { id: '99' }, userId: 2 }
  const res = createRes()
  await deleteCalendarEvent(req, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到此行事曆行程' })
})

test('刪除行事曆行程失敗時應回傳 500', async (t) => {
  t.mock.method(console, 'error', () => {})
  const deleteCalendarEvent = createDeleteCalendarEvent({
    deleteEvent: async () => {
      throw new Error('DB error')
    },
  })

  const req = { params: { id: '1' }, userId: 2 }
  const res = createRes()
  await deleteCalendarEvent(req, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '刪除行事曆行程失敗' })
})
