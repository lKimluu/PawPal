import { z } from 'zod'

export const createHospitalReviewSchema = z.object({
  rating: z.coerce
    .number({ error: '請選擇 1 到 5 顆星評分' })
    .int({ error: '評分必須是整數' })
    .min(1, { error: '請選擇 1 到 5 顆星評分' })
    .max(5, { error: '請選擇 1 到 5 顆星評分' }),
  comment: z
    .string({ error: '請輸入您對這間醫院的評論' })
    .trim()
    .min(1, { error: '請輸入您對這間醫院的評論' })
    .max(1000, { error: '評論內容不可超過 1000 字' }),
})

export const updateHospitalReviewSchema = createHospitalReviewSchema
