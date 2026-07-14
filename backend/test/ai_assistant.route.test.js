import assert from 'node:assert/strict'
import { test } from 'node:test'

import app from '../src/app.js'
import aiAssistantRoutes from '../src/routes/ai_assistant.route.js'
import { askAiAssistant } from '../src/controllers/ai_assistant.controller.js'

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

test('AI 小助手路由應提供 POST / 並依序串接 rate limiter、schema 驗證與 controller', () => {
  const routes = aiAssistantRoutes.stack.map((layer) => ({
    path: layer.route?.path,
    methods: Object.keys(layer.route?.methods ?? {}),
    middleware: layer.route?.stack,
  }))

  assert.deepEqual(
    routes.map(({ path, methods }) => ({ path, methods })),
    [{ path: '/', methods: ['post'] }],
  )

  const [{ middleware }] = routes

  assert.equal(middleware.length, 3)
  assert.equal(typeof middleware[0].handle, 'function')
  assert.equal(typeof middleware[1].handle, 'function')
  assert.equal(middleware[2].handle, askAiAssistant)
})

test('應將 AI 小助手路由掛載在 /api/v1/ai-assistant', () => {
  const hasAiAssistantRouter = app.router.stack.some((layer) => layer.handle === aiAssistantRoutes)

  assert.equal(hasAiAssistantRouter, true)
})

test('訊息驗證失敗時不應進入 controller', () => {
  const postRoute = aiAssistantRoutes.stack.find((layer) => layer.route?.path === '/')
  const validateBody = postRoute.route.stack[1].handle
  const req = { body: { message: '' } }
  const res = createResponse()
  let nextCalled = false

  validateBody(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '請輸入問題內容' })
})

test('訊息驗證成功時應寫入修剪後的 req.body 並呼叫 next', () => {
  const postRoute = aiAssistantRoutes.stack.find((layer) => layer.route?.path === '/')
  const validateBody = postRoute.route.stack[1].handle
  const req = { body: { message: '  貓咪一天要吃幾餐？  ' } }
  const res = createResponse()
  let nextCalled = false

  validateBody(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.equal(res.statusCode, null)
  assert.deepEqual(req.body, { message: '貓咪一天要吃幾餐？' })
})
