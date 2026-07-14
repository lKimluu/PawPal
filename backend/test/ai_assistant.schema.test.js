import assert from 'node:assert/strict'
import { test } from 'node:test'

import { aiAssistantMessageSchema } from '../src/schemas/ai_assistant.schema.js'

test('AI 小助手 schema 應拒絕空字串訊息', () => {
  const result = aiAssistantMessageSchema.safeParse({ message: '' })

  assert.equal(result.success, false)
  assert.equal(result.error.issues[0]?.message, '請輸入問題內容')
})

test('AI 小助手 schema 應拒絕只有空白的訊息', () => {
  const result = aiAssistantMessageSchema.safeParse({ message: '   ' })

  assert.equal(result.success, false)
  assert.equal(result.error.issues[0]?.message, '請輸入問題內容')
})

test('AI 小助手 schema 應拒絕超過 100 字的訊息', () => {
  const result = aiAssistantMessageSchema.safeParse({ message: '狗'.repeat(101) })

  assert.equal(result.success, false)
  assert.equal(result.error.issues[0]?.message, '問題內容不可超過 100 字')
})

test('AI 小助手 schema 應接受正常長度的訊息並修剪前後空白', () => {
  const result = aiAssistantMessageSchema.safeParse({ message: '  貓咪一天要吃幾餐？  ' })

  assert.equal(result.success, true)
  assert.equal(result.data.message, '貓咪一天要吃幾餐？')
})
