import assert from 'node:assert/strict'
import { test } from 'node:test'

import { updateCurrentUserSchema } from '../src/schemas/users.schema.js'

test('updateCurrentUserSchema 只接受 name 與 avatar_url 並忽略其他欄位', () => {
  const result = updateCurrentUserSchema.safeParse({
    name: ' Alice Lin ',
    avatar_url: ' https://example.com/alice.png ',
    email: 'ignored@example.com',
  })

  assert.equal(result.success, true)
  assert.deepEqual(result.data, {
    name: 'Alice Lin',
    avatar_url: 'https://example.com/alice.png',
  })
})

test('updateCurrentUserSchema 拒絕空白修改內容與空白姓名', () => {
  assert.equal(updateCurrentUserSchema.safeParse({}).success, false)
  assert.equal(updateCurrentUserSchema.safeParse({ name: '   ' }).success, false)
})
