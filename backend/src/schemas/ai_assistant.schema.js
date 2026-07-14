import { z } from 'zod'

const MAX_MESSAGE_LENGTH = 150

export const aiAssistantMessageSchema = z.object({
  message: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z
      .string({ error: '請輸入問題內容' })
      .min(1, { error: '請輸入問題內容' })
      .max(MAX_MESSAGE_LENGTH, { error: `問題內容不可超過 ${MAX_MESSAGE_LENGTH} 字` }),
  ),
})
