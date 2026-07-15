import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createAiAssistantController } from '../src/controllers/ai_assistant.controller.js'
import { AiAssistantQuotaExceededError } from '../src/services/ai_assistant.service.js'

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

test('askAiAssistant 成功時應回傳 200 與 reply', async () => {
  const { askAiAssistant } = createAiAssistantController({
    getAiAssistantReply: async (message) => {
      assert.equal(message, '貓咪一天要吃幾餐？')
      return { reply: '成貓建議一天餵食 2 餐。' }
    },
  })
  const res = createResponse()

  await askAiAssistant({ body: { message: '貓咪一天要吃幾餐？' } }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { reply: '成貓建議一天餵食 2 餐。' })
})

test('askAiAssistant 遇到 quota 超限錯誤時應回傳 503 固定中文訊息', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { askAiAssistant } = createAiAssistantController({
    getAiAssistantReply: async () => {
      throw new AiAssistantQuotaExceededError()
    },
  })
  const res = createResponse()

  await askAiAssistant({ body: { message: '貓咪一天要吃幾餐？' } }, res)

  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, { message: 'AI 小助手目前使用量較大，請稍後再試' })
})

test('askAiAssistant 發生非預期錯誤時應回傳 500 中文訊息', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { askAiAssistant } = createAiAssistantController({
    getAiAssistantReply: async () => {
      throw new Error('network error')
    },
  })
  const res = createResponse()

  await askAiAssistant({ body: { message: '貓咪一天要吃幾餐？' } }, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: 'AI 小助手回覆失敗，請稍後再試' })
})
