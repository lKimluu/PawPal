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

test('遇到急症關鍵字時，直接回傳緊急提醒，不呼叫 Gemini', async () => {
  const geminiClient = createStubGeminiClient(() => {
    throw new Error('should not be called')
  })

  const result = await getAiAssistantReply('狗狗吃到巧克力怎麼辦？', { geminiClient })

  assert.match(result.reply, /緊急情況|盡速帶牠就醫|聯繫獸醫/)
  assert.equal(geminiClient.getCallCount(), 0)
})

test('一般問題會呼叫 Gemini，並帶入正確 model 與 config', async () => {
  const geminiClient = createStubGeminiClient((params) => {
    assert.equal(params.model, 'gemini-3.1-flash-lite')
    assert.equal(params.contents, '狗狗多久洗一次澡？')
    assert.equal(typeof params.config.systemInstruction, 'string')
    assert.equal(params.config.temperature, 0.4)

    return { text: '一般會依品種、毛長與生活型態而不同。' }
  })

  const result = await getAiAssistantReply('狗狗多久洗一次澡？', { geminiClient })

  assert.equal(result.reply, '一般會依品種、毛長與生活型態而不同。')
  assert.equal(geminiClient.getCallCount(), 1)
})

test('Gemini 回傳空內容時，會使用 fallback 訊息', async () => {
  const geminiClient = createStubGeminiClient(() => {
    return { text: '   ' }
  })

  const result = await getAiAssistantReply('貓咪一天要喝多少水？', { geminiClient })

  assert.equal(result.reply, '目前無法產生回覆，請稍後再試一次。')
})

test('Gemini quota exceeded 時，會拋出 AiAssistantQuotaExceededError', async () => {
  const geminiClient = createStubGeminiClient(() => {
    const error = new Error('RESOURCE_EXHAUSTED: quota exceeded')
    error.status = 429
    throw error
  })

  await assert.rejects(
    () => getAiAssistantReply('狗狗多久洗一次澡？', { geminiClient }),
    (error) => {
      assert.ok(error instanceof AiAssistantQuotaExceededError)
      assert.equal(error.message, 'AI 小助手目前使用量較大，請稍後再試')
      return true
    },
  )
})

test('非 quota 類錯誤會原樣拋出', async () => {
  const geminiClient = createStubGeminiClient(() => {
    throw new Error('network error')
  })

  await assert.rejects(
    () => getAiAssistantReply('狗狗多久洗一次澡？', { geminiClient }),
    (error) => {
      assert.equal(error.message, 'network error')
      return true
    },
  )
})
