import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from '../src/schemas/calendar_events.schema.js'

test('更新行程 schema 應接受 event_time 為 null（清空時間）', () => {
  const result = updateCalendarEventSchema.safeParse({ event_time: null })

  assert.equal(result.success, true)
  assert.equal(result.data.event_time, null)
})

test('更新行程 schema 應接受合法的 HH:MM 時間', () => {
  const result = updateCalendarEventSchema.safeParse({ event_time: '14:30' })

  assert.equal(result.success, true)
  assert.equal(result.data.event_time, '14:30')
})

test('更新行程 schema 應拒絕不合法的時間格式', () => {
  for (const value of ['9:30', 'abc', '']) {
    const result = updateCalendarEventSchema.safeParse({ event_time: value })

    assert.equal(result.success, false)
    assert.equal(result.error.issues[0]?.message, '請輸入正確的時間格式（HH:MM）')
  }
})

test('更新行程 schema 未提供任何欄位時應被拒絕', () => {
  const result = updateCalendarEventSchema.safeParse({})

  assert.equal(result.success, false)
})

test('建立行程 schema 的 event_time 仍不接受 null（僅允許省略）', () => {
  const base = {
    pet_id: 1,
    title: '回診',
    event_date: '2026-07-15',
    type: 'vet',
  }

  const withNull = createCalendarEventSchema.safeParse({ ...base, event_time: null })
  assert.equal(withNull.success, false)

  const omitted = createCalendarEventSchema.safeParse(base)
  assert.equal(omitted.success, true)
})
