import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pool } from '../src/config/db.js'
import {
  getEventsByUserId,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../src/services/calendar_events.service.js'

test('getEventsByUserId：應回傳該使用者的行程', async (t) => {
  const rows = [{ id: 1, title: '回診', type: 'vet', event_date: '2026-07-01' }]
  const query = t.mock.method(pool, 'query', async (text, values) => {
    assert.ok(text.includes('WHERE p.user_id'))
    assert.deepEqual(values, [1])
    return { rows }
  })

  const result = await getEventsByUserId(1)

  assert.deepEqual(result, rows)
  assert.equal(query.mock.callCount(), 1)
})

test('createEvent：成功時應回傳新建立的行程', async (t) => {
  const newRow = { id: 3, pet_id: 1, title: '施打疫苗', type: 'vaccine' }
  t.mock.method(pool, 'query', async () => ({ rows: [newRow] }))

  const result = await createEvent({
    pet_id: 1,
    userId: 2,
    title: '施打疫苗',
    event_date: '2026-07-10',
    type: 'vaccine',
  })

  assert.deepEqual(result, newRow)
})

test('createEvent：pet 不屬於該使用者時應回傳 null', async (t) => {
  t.mock.method(pool, 'query', async () => ({ rows: [] }))

  const result = await createEvent({
    pet_id: 99,
    userId: 2,
    title: '施打疫苗',
    event_date: '2026-07-10',
    type: 'vaccine',
  })

  assert.equal(result, null)
})

test('updateEvent：成功時應回傳更新後的行程', async (t) => {
  const updatedRow = { id: 1, title: '複診', type: 'vet' }
  t.mock.method(pool, 'query', async () => ({ rows: [updatedRow] }))

  const result = await updateEvent('1', { title: '複診' }, 2)

  assert.deepEqual(result, updatedRow)
})

test('updateEvent：event_time 為 null 時應以 null 寫入資料庫（清空時間）', async (t) => {
  const updatedRow = { id: 1, title: '複診', event_time: null }
  const query = t.mock.method(pool, 'query', async (text, values) => {
    assert.ok(text.includes('event_time = $1'))
    assert.equal(values[0], null)
    return { rows: [updatedRow] }
  })

  const result = await updateEvent('1', { event_time: null }, 2)

  assert.deepEqual(result, updatedRow)
  assert.equal(query.mock.callCount(), 1)
})

test('updateEvent：沒有合法欄位時應直接回傳 null（不呼叫 DB）', async (t) => {
  const query = t.mock.method(pool, 'query', async () => ({ rows: [] }))

  const result = await updateEvent('1', { hacked: 'x' }, 2)

  assert.equal(result, null)
  assert.equal(query.mock.callCount(), 0)
})

test('updateEvent：行程不屬於該使用者時應回傳 null', async (t) => {
  t.mock.method(pool, 'query', async () => ({ rows: [] }))

  const result = await updateEvent('99', { title: '複診' }, 2)

  assert.equal(result, null)
})

test('deleteEvent：成功時應回傳被刪除行程的 id 與 google_event_id', async (t) => {
  t.mock.method(pool, 'query', async (text) => {
    assert.ok(text.includes('RETURNING ce.id, ce.google_event_id'))
    return { rows: [{ id: 1, google_event_id: null }] }
  })

  const result = await deleteEvent('1', 2)

  assert.deepEqual(result, { id: 1, google_event_id: null })
})

test('deleteEvent：行程不屬於該使用者時應回傳 null', async (t) => {
  t.mock.method(pool, 'query', async () => ({ rows: [] }))

  const result = await deleteEvent('99', 2)

  assert.equal(result, null)
})
