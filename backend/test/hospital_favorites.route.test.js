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

async function runRouteStack(route, req, res) {
  for (const layer of route.route.stack) {
    let shouldContinue = false
    await layer.handle(req, res, () => {
      shouldContinue = true
    })

    if (!shouldContinue) return
  }
}

test('新增收藏路由未登入時應在 controller 前回傳 401', async () => {
  const route = findRoute('/:hospital_id/favorite', 'post')
  const req = { headers: {}, params: { hospital_id: '15' } }
  const res = createResponse()

  await runRouteStack(route, req, res)

  assert.equal(res.statusCode, 401)
})

test('取消收藏路由未登入時應在 controller 前回傳 401', async () => {
  const route = findRoute('/:hospital_id/favorite', 'delete')
  const req = { headers: {}, params: { hospital_id: '15' } }
  const res = createResponse()

  await runRouteStack(route, req, res)

  assert.equal(res.statusCode, 401)
})

test('收藏路由應拒絕無效 hospital_id', () => {
  const route = findRoute('/:hospital_id/favorite', 'post')
  const validateParams = route.route.stack[1].handle
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

test('GET /hospitals 未帶 token 時應以匿名身分放行不設定 userId', () => {
  const route = findRoute('/', 'get')
  const attachUser = route.route.stack[0].handle
  const req = { headers: {} }
  const res = createResponse()
  let nextCalled = false

  attachUser(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.equal(req.userId, undefined)
})
