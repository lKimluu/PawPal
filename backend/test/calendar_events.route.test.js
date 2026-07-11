import assert from 'node:assert/strict'
import { test } from 'node:test'

import calendarEventsRoutes from '../src/routes/calendar_events.route.js'

function findRoute(path, method) {
  return calendarEventsRoutes.stack.find(
    (layer) => layer.route?.path === path && layer.route?.methods[method],
  )
}

test('應註冊 GET / 路由並掛上 authenticateToken', () => {
  const route = findRoute('/', 'get')
  assert.ok(route)
  // authenticateToken + controller = 2
  assert.equal(route.route.stack.length, 2)
})

test('應註冊 POST / 路由並掛上 authenticateToken 與 validate', () => {
  const route = findRoute('/', 'post')
  assert.ok(route)
  // authenticateToken + validate + controller = 3
  assert.equal(route.route.stack.length, 3)
})

test('應註冊 PATCH /:id 路由並掛上 authenticateToken 與 validate', () => {
  const route = findRoute('/:id', 'patch')
  assert.ok(route)
  // authenticateToken + validate(params) + validate(body) + controller = 4
  assert.equal(route.route.stack.length, 4)
})

test('應註冊 DELETE /:id 路由並掛上 authenticateToken', () => {
  const route = findRoute('/:id', 'delete')
  assert.ok(route)
  // authenticateToken + validate(params) + controller = 3
  assert.equal(route.route.stack.length, 3)
})

test('應註冊 POST /:id/resync 路由並掛上 authenticateToken 與 validate', () => {
  const route = findRoute('/:id/resync', 'post')
  assert.ok(route)
  // authenticateToken + validate(params) + controller = 3
  assert.equal(route.route.stack.length, 3)
})
