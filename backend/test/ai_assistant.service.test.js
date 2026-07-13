import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  AiAssistantQuotaExceededError,
  getAiAssistantReply,
} from '../src/services/ai_assistant.service.js'

function createStubGeminiClient(generateContentImpl) {
  let callCount = 0

  return {
    models: {
      generateContent: async (params) => {
        callCount += 1
        return generateContentImpl(params)
      },
    },
    getCallCount: () => callCount,
  }
}

test('命中急症關鍵字時應短路回傳固定模板且不呼叫 Gemini', async () => {
  const geminiClient = createStubGeminiClient(() => {
    throw new Error('should not be called')
  })

  const result = await getAiAssistantReply('我的狗狗一直抽搐怎麼辦', { geminiClient })

  assert.match(result.reply, /就醫|獸醫/)
  assert.equal(geminiClient.getCallCount(), 0)
})

test('未命中急症關鍵字時應呼叫注入的 Gemini client 並回傳其內容', async () => {
  const geminiClient = createStubGeminiClient((params) => {
    assert.equal(params.model, 'gemini-2.0-flash')
    assert.equal(params.contents, '貓咪一天要吃幾餐？')
    return { text: '成貓建議一天餵食 2 餐。' }
  })

  const result = await getAiAssistantReply('貓咪一天要吃幾餐？', { geminiClient })

  assert.equal(result.reply, '成貓建議一天餵食 2 餐。')
  assert.equal(geminiClient.getCallCount(), 1)
})

test('Gemini client 拋出 quota 相關錯誤時應轉換為固定中文訊息', async () => {
  const geminiClient = createStubGeminiClient(() => {
    const error = new Error('RESOURCE_EXHAUSTED: quota exceeded')
    error.status = 429
    throw error
  })

  await assert.rejects(
    () => getAiAssistantReply('貓咪一天要吃幾餐？', { geminiClient }),
    (error) => {
      assert.ok(error instanceof AiAssistantQuotaExceededError)
      assert.equal(error.message, 'AI 小助手目前使用量較大，請稍後再試')
      return true
    },
  )
})

test('Gemini client 拋出非 quota 錯誤時應原樣拋出', async () => {
  const geminiClient = createStubGeminiClient(() => {
    throw new Error('network error')
  })

  await assert.rejects(
    () => getAiAssistantReply('貓咪一天要吃幾餐？', { geminiClient }),
    (error) => {
      assert.equal(error.message, 'network error')
      return true
    },
  )
})
