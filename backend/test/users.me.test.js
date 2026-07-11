import assert from 'node:assert/strict'
import { test } from 'node:test'

import * as userController from '../src/controllers/users.controller.js'

function createResponse(statusCode = null) {
  return {
    statusCode,
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

function createTestController(findUserById) {
  assert.equal(typeof userController.createGetCurrentUser, 'function')

  return userController.createGetCurrentUser({ findUserById })
}

function createTestUpdateController(updateCurrentUser) {
  assert.equal(typeof userController.createUpdateCurrentUser, 'function')

  return userController.createUpdateCurrentUser({ updateCurrentUser })
}

test('取得目前會員資料時回傳不含密碼的會員資料', async () => {
  const user = {
    id: 1,
    email: 'alice@example.com',
    name: 'Alice Chen',
    avatar_url: null,
    created_at: new Date('2026-06-18T00:00:00Z'),
  }
  const getCurrentUser = createTestController(async (id) => {
    assert.equal(id, 1)
    return user
  })
  const req = { userId: 1 }
  const res = createResponse()

  await getCurrentUser(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { user })
  assert.equal(Object.hasOwn(res.body.user, 'password'), false)
})

test('取得目前會員資料但會員不存在時回傳 404', async () => {
  const getCurrentUser = createTestController(async () => null)
  const req = { userId: 999 }
  const res = createResponse(200)

  await getCurrentUser(req, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到使用者' })
})

test('取得目前會員資料發生服務錯誤時回傳 500', async (t) => {
  t.mock.method(console, 'error', () => {})

  const getCurrentUser = createTestController(async () => {
    throw new Error('Database unavailable')
  })
  const req = { userId: 1 }
  const res = createResponse()

  await getCurrentUser(req, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '取得使用者資料失敗' })
})

test('修改目前會員資料後回傳不含密碼的更新後會員資料', async () => {
  const updatedUser = {
    id: 1,
    email: 'alice@example.com',
    name: 'Alice Lin',
    avatar_url: 'https://example.com/alice.png',
    created_at: new Date('2026-06-18T00:00:00Z'),
  }
  const updateCurrentUser = createTestUpdateController(async (id, payload) => {
    assert.equal(id, 1)
    assert.deepEqual(payload, {
      name: 'Alice Lin',
      avatar_url: 'https://example.com/alice.png',
    })
    return updatedUser
  })
  const req = {
    userId: 1,
    body: {
      name: 'Alice Lin',
      avatar_url: 'https://example.com/alice.png',
    },
  }
  const res = createResponse()

  await updateCurrentUser(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { user: updatedUser })
  assert.equal(Object.hasOwn(res.body.user, 'password'), false)
})

test('修改目前會員資料但會員不存在時回傳 404', async () => {
  const updateCurrentUser = createTestUpdateController(async () => null)
  const req = { userId: 999, body: { name: 'Missing User' } }
  const res = createResponse(200)

  await updateCurrentUser(req, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到會員資料' })
})
