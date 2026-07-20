import assert from 'node:assert/strict'
import { test } from 'node:test'
import jwt from 'jsonwebtoken'

import { attachUserIfPresent, authenticateToken } from '../src/middlewares/auth.middleware.js'

const JWT_SECRET = 'middleware-test-secret'

function createResponse() {
  return {
    statusCode: 200,
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

test('缺少 Authorization token 時應拒絕請求', () => {
  const req = { headers: {} }
  const res = createResponse()
  let nextCalled = false

  authenticateToken(req, res, () => {
    nextCalled = true
  })

  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { message: '未授權，請重新登入' })
  assert.equal(nextCalled, false)
})

test('JWT token 無效時應拒絕請求', () => {
  const req = { headers: { authorization: 'Bearer invalid-token' } }
  const res = createResponse()
  let nextCalled = false

  authenticateToken(req, res, () => {
    nextCalled = true
  })

  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { message: '未授權，請重新登入' })
  assert.equal(nextCalled, false)
})

test('JWT token 有效時應儲存使用者 ID 並繼續處理請求', () => {
  process.env.JWT_SECRET = JWT_SECRET
  const token = jwt.sign({ sub: 42 }, JWT_SECRET)
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = createResponse()
  let nextCalled = false

  authenticateToken(req, res, () => {
    nextCalled = true
  })

  assert.equal(req.userId, 42)
  assert.equal(res.statusCode, 200)
  assert.equal(nextCalled, true)
})

test('Bearer 大小寫不同且包含多個空白時仍應通過驗證', () => {
  process.env.JWT_SECRET = JWT_SECRET
  const token = jwt.sign({ sub: 42 }, JWT_SECRET)
  const req = { headers: { authorization: `bearer   ${token}` } }
  const res = createResponse()
  let nextCalled = false

  authenticateToken(req, res, () => {
    nextCalled = true
  })

  assert.equal(req.userId, 42)
  assert.equal(res.statusCode, 200)
  assert.equal(nextCalled, true)
})

test('JWT 的 sub 欄位不是正整數時應拒絕請求', () => {
  process.env.JWT_SECRET = JWT_SECRET
  const token = jwt.sign({ sub: 'not-a-user-id' }, JWT_SECRET)
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = createResponse()
  let nextCalled = false

  authenticateToken(req, res, () => {
    nextCalled = true
  })

  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { message: '未授權，請重新登入' })
  assert.equal(nextCalled, false)
})

test('未設定 JWT_SECRET 時應拒絕 token', () => {
  delete process.env.JWT_SECRET
  const token = jwt.sign({ sub: 42 }, 'test-secret')
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = createResponse()
  let nextCalled = false

  authenticateToken(req, res, () => {
    nextCalled = true
  })

  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { message: '未授權，請重新登入' })
  assert.equal(nextCalled, false)
})

test('attachUserIfPresent：有效 token 時應設定 userId 並放行', () => {
  process.env.JWT_SECRET = JWT_SECRET
  const token = jwt.sign({ sub: 42 }, JWT_SECRET)
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = createResponse()
  let nextCalled = false

  attachUserIfPresent(req, res, () => {
    nextCalled = true
  })

  assert.equal(req.userId, 42)
  assert.equal(res.statusCode, 200)
  assert.equal(nextCalled, true)
})

test('attachUserIfPresent：沒有 token 時應以匿名身分放行且不設定 userId', () => {
  const req = { headers: {} }
  const res = createResponse()
  let nextCalled = false

  attachUserIfPresent(req, res, () => {
    nextCalled = true
  })

  assert.equal(req.userId, undefined)
  assert.equal(res.statusCode, 200)
  assert.equal(nextCalled, true)
})

test('attachUserIfPresent：無效 token 時應以匿名身分放行且不設定 userId', () => {
  process.env.JWT_SECRET = JWT_SECRET
  const req = { headers: { authorization: 'Bearer invalid-token' } }
  const res = createResponse()
  let nextCalled = false

  attachUserIfPresent(req, res, () => {
    nextCalled = true
  })

  assert.equal(req.userId, undefined)
  assert.equal(res.statusCode, 200)
  assert.equal(nextCalled, true)
})
