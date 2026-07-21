import assert from 'node:assert/strict'
import { test } from 'node:test'

import app from '../src/app.js'
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
  }
}

test('醫院路由應提供清單、附近、地區、地圖與評論查詢', () => {
  const routes = hospitalRoutes.stack.map((layer) => ({
    path: layer.route?.path,
    methods: Object.keys(layer.route?.methods ?? {}),
    middleware: layer.route?.stack,
  }))

  assert.deepEqual(
    routes.map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/', methods: ['get'] },
      { path: '/nearby', methods: ['get'] },
      { path: '/regions', methods: ['get'] },
      { path: '/map', methods: ['get'] },
      { path: '/:hospital_id/reviews', methods: ['get'] },
      { path: '/:hospital_id/reviews', methods: ['post'] },
      { path: '/:hospital_id/reviews/me', methods: ['patch'] },
      { path: '/:hospital_id/reviews/me', methods: ['delete'] },
      { path: '/:hospital_id/favorite', methods: ['post'] },
      { path: '/:hospital_id/favorite', methods: ['delete'] },
    ],
  )

  assert.equal(routes.find((route) => route.path === '/regions').middleware.length, 1)
  assert.equal(routes.find((route) => route.path === '/nearby').middleware.length, 3)

  const listMiddleware = routes.find((route) => route.path === '/').middleware
  assert.equal(listMiddleware.length, 3)
  assert.equal(typeof listMiddleware[0].handle, 'function')

  const mapMiddleware = routes.find((route) => route.path === '/map').middleware
  assert.equal(mapMiddleware.length, 4)
  assert.equal(typeof mapMiddleware[0].handle, 'function')

  assert.equal(routes[4].middleware.length, 3)
  assert.equal(routes[5].middleware.length, 4)
  assert.equal(routes[6].middleware.length, 4)
  assert.equal(routes[7].middleware.length, 3)
})

test('應將醫院路由掛載在 /api/v1/hospitals', () => {
  const hasHospitalRouter = app.router.stack.some((layer) => layer.handle === hospitalRoutes)

  assert.equal(hasHospitalRouter, true)
})

test('醫院清單 query validation 失敗時不應進入 controller', () => {
  const listRoute = hospitalRoutes.stack.find((layer) => layer.route?.path === '/')
  const validateQuery = listRoute.route.stack[1].handle
  const req = { query: { page: '0' } }
  const res = createResponse()
  let nextCalled = false

  validateQuery(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '頁碼必須大於 0' })
})

test('醫院清單 query validation 成功時應寫入 validated_query 且不重新指定 req.query', () => {
  const listRoute = hospitalRoutes.stack.find((layer) => layer.route?.path === '/')
  const validateQuery = listRoute.route.stack[1].handle
  const req = {}
  Object.defineProperty(req, 'query', {
    get() {
      return { keyword: ' 仁愛 ', animal_type: ' cat ', page: '2', limit: '10' }
    },
    enumerable: true,
  })
  const res = createResponse()
  let nextCalled = false

  validateQuery(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.equal(res.statusCode, null)
  assert.deepEqual(req.validated_query, {
    keyword: '仁愛',
    animal_type: 'cat',
    page: 2,
    limit: 10,
  })
})

test('附近醫院 query validation 失敗時不應進入 controller', () => {
  const nearbyRoute = hospitalRoutes.stack.find((layer) => layer.route?.path === '/nearby')
  const validateQuery = nearbyRoute.route.stack[1].handle
  const req = { query: { lat: '91', lng: '121' } }
  const res = createResponse()
  let nextCalled = false

  validateQuery(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '緯度必須介於 -90 到 90 之間' })
})

test('附近醫院 query validation 成功時應寫入 validated_query 且不重新指定 req.query', () => {
  const nearbyRoute = hospitalRoutes.stack.find((layer) => layer.route?.path === '/nearby')
  const validateQuery = nearbyRoute.route.stack[1].handle
  const req = {}
  Object.defineProperty(req, 'query', {
    get() {
      return { lat: '25.033', lng: '121.5654', radius: '5', limit: '20' }
    },
    enumerable: true,
  })
  const res = createResponse()
  let nextCalled = false

  validateQuery(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.equal(res.statusCode, null)
  assert.deepEqual(req.validated_query, {
    lat: 25.033,
    lng: 121.5654,
    radius: 5,
    limit: 20,
  })
})
