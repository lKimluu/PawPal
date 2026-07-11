import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pool } from '../src/config/db.js'
import { updateCurrentUser } from '../src/services/users.service.js'

test('updateCurrentUser 只更新目前會員允許修改的個人資料欄位', async (t) => {
  const row = {
    id: 1,
    email: 'alice@example.com',
    name: 'Alice Lin',
    avatar_url: 'https://example.com/alice.png',
    created_at: new Date('2026-06-18T00:00:00Z'),
  }
  const query = t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /UPDATE users/)
    assert.match(text, /name = \$1/)
    assert.match(text, /avatar_url = \$2/)
    assert.match(text, /WHERE id = \$3/)
    assert.doesNotMatch(text, /email =/)
    assert.doesNotMatch(text, /password =/)
    assert.deepEqual(values, ['Alice Lin', 'https://example.com/alice.png', 1])
    return { rows: [row] }
  })

  const user = await updateCurrentUser(1, {
    name: 'Alice Lin',
    avatar_url: 'https://example.com/alice.png',
    email: 'ignored@example.com',
  })

  assert.equal(query.mock.callCount(), 1)
  assert.deepEqual(user, row)
})

test('updateCurrentUser 沒有提供允許修改的欄位時回傳 null 且不查詢資料庫', async (t) => {
  const query = t.mock.method(pool, 'query', async () => {
    throw new Error('query should not be called')
  })

  const user = await updateCurrentUser(1, { email: 'ignored@example.com' })

  assert.equal(query.mock.callCount(), 0)
  assert.equal(user, null)
})
