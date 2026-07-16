import { z } from 'zod'

function trimmed_comment(value) {
  if (typeof value !== 'string') {
    return value
  }

  return value.trim()
}

export const hospitalReviewParamsSchema = z.object({
  hospital_id: z.coerce
    .number({ error: '醫院編號格式不正確' })
    .int({ error: '醫院編號格式不正確' })
    .positive({ error: '醫院編號格式不正確' }),
})

export const hospitalReviewQuerySchema = z.object({
  page: z.coerce
    .number({ error: '頁碼格式不正確' })
    .int({ error: '頁碼必須是整數' })
    .min(1, { error: '頁碼必須大於 0' })
    .default(1),
  limit: z.coerce
    .number({ error: '每頁筆數格式不正確' })
    .int({ error: '每頁筆數必須是整數' })
    .min(1, { error: '每頁筆數必須大於 0' })
    .max(100, { error: '每頁筆數不可超過 100' })
    .default(50),
})

export const hospitalReviewBodySchema = z.object({
  rating: z
    .number({ error: '評分格式不正確' })
    .int({ error: '評分必須是整數' })
    .min(1, { error: '評分必須介於 1 到 5 之間' })
    .max(5, { error: '評分必須介於 1 到 5 之間' }),
  comment: z.preprocess(
    trimmed_comment,
    z
      .string({ error: '評論內容不可空白' })
      .min(1, { error: '評論內容不可空白' })
      .max(1000, { error: '評論內容不可超過 1000 字' }),
  ),
})
