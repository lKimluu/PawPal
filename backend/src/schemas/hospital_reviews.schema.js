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

export const hospitalReviewBodySchema = z.object({
  rating: z.coerce
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
