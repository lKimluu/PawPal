import assert from 'node:assert/strict'
import { test } from 'node:test'

import hospitalRoutes from '../src/routes/hospitals.route.js'

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
    send() {
      return this
    },
  }
}

function findRoute(path, method) {
  return hospitalRoutes.stack.find((layer) => (
    layer.route?.path === path && layer.route?.methods?.[method]
  ))
}

test('醫院評論路由應掛在 hospitals router 並區分公開讀取與登入寫入', () => {
  const routes = hospitalRoutes.stack.map((layer) => ({
    path: layer.route?.path,
    methods: Object.keys(layer.route?.methods ?? {}),
    middleware: layer.route?.stack ?? [],
  }))

  assert.deepEqual(
    routes.map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/', methods: ['get'] },
      { path: '/nearby', methods: ['get'] },
      { path: '/map', methods: ['get'] },
      { path: '/:hospital_id/reviews', methods: ['get'] },
      { path: '/:hospital_id/reviews', methods: ['post'] },
      { path: '/:hospital_id/reviews/me', methods: ['patch'] },
      { path: '/:hospital_id/reviews/me', methods: ['delete'] },
    ],
  )

  assert.equal(routes[3].middleware.length, 2)
  assert.equal(routes[4].middleware.length, 4)
  assert.equal(routes[5].middleware.length, 4)
  assert.equal(routes[6].middleware.length, 3)
})

test('醫院評論讀取路由應驗證 hospital_id 後公開進入 controller', () => {
  const route = findRoute('/:hospital_id/reviews', 'get')
  const validateParams = route.route.stack[0].handle
  const req = { params: { hospital_id: '15' } }
  const res = createResponse()
  let nextCalled = false

  validateParams(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.equal(res.statusCode, null)
  assert.deepEqual(req.params, { hospital_id: 15 })
})

test('醫院評論寫入路由未登入時應在 controller 前回傳 401', () => {
  const route = findRoute('/:hospital_id/reviews', 'post')
  const validateParams = route.route.stack[0].handle
  const authenticate = route.route.stack[1].handle
  const req = {
    headers: {},
    params: { hospital_id: '15' },
    body: { rating: 5, comment: 'Careful doctor' },
  }
  const res = createResponse()
  let reachedController = false

  validateParams(req, res, () => {})
  authenticate(req, res, () => {
    reachedController = true
  })

  assert.equal(res.statusCode, 401)
  assert.equal(reachedController, false)
})

test('醫院評論寫入路由應驗證 body 並以繁中 message 回傳 400', () => {
  const route = findRoute('/:hospital_id/reviews', 'post')
  const validateBody = route.route.stack[2].handle
  const req = {
    body: { rating: '6', comment: 'Careful doctor' },
  }
  const res = createResponse()
  let nextCalled = false

  validateBody(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '評分必須介於 1 到 5 之間' })
})

test('醫院評論路由應拒絕無效 hospital_id', () => {
  const route = findRoute('/:hospital_id/reviews', 'get')
  const validateParams = route.route.stack[0].handle
  const req = { params: { hospital_id: '0' } }
  const res = createResponse()
  let nextCalled = false

  validateParams(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '醫院編號格式不正確' })
})
