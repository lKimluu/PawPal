import assert from 'node:assert/strict'
import { test } from 'node:test'

import { authenticateToken } from '../src/middlewares/auth.middleware.js'
import { normalizeUserMultipartBody, uploadUserAvatar } from '../src/middlewares/upload_image.js'
import userRoutes from '../src/routes/users.route.js'

test('應註冊取得目前使用者資料的 GET /me 路由', () => {
  const route = userRoutes.stack.find((layer) => layer.route?.path === '/me')

  assert.ok(route)
  assert.equal(route.route.methods.get, true)
  assert.equal(route.route.stack.length, 2)
})

test('PATCH /me 需要登入驗證、驗證 body 後交給 controller', () => {
  const route = userRoutes.stack.find(
    (layer) => layer.route?.path === '/me' && layer.route?.methods.patch,
  )

  assert.ok(route)
  assert.equal(route.route.methods.patch, true)
  assert.equal(route.route.stack.length, 5)
  assert.equal(route.route.stack[0].handle, authenticateToken)
  assert.equal(route.route.stack[1].handle, uploadUserAvatar)
  assert.equal(route.route.stack[2].handle, normalizeUserMultipartBody)
  assert.equal(typeof route.route.stack[3].handle, 'function')
})
