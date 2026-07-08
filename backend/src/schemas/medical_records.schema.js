import { z } from 'zod'
import { MEDICAL_IMAGE_UPLOAD_INTENT_FIELD } from '../middlewares/upload_image.js'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const RECORD_TYPES = ['看診', '疫苗', '手術', '用藥', '體檢', '其他']

export const createRecordSchema = z.object({
  pet_id: z
    .number({
      error: (issue) => (issue.input === undefined ? '請選擇寵物' : '寵物 ID 必須是數字'),
    })
    .int({ message: '寵物 ID 必須是整數' })
    .positive({ message: '寵物 ID 必須大於 0' }),
  record_type: z.enum(RECORD_TYPES, {
    error: (issue) =>
      issue.input === undefined
        ? '請選擇紀錄類型'
        : '請選擇正確的紀錄類型（看診、疫苗、手術、用藥、體檢、其他）',
  }),
  hospital_name: z.string().trim().max(100, { message: '醫院名稱過長' }).optional(),
  title: z
    .string({ error: '請填寫標題' })
    .trim()
    .min(1, { message: '標題不能為空白' })
    .max(200, { message: '標題過長' }),
  record_date: z
    .string({ error: '請選擇日期' })
    .regex(dateRegex, { message: '請輸入正確的日期格式 (YYYY-MM-DD)' })
    .refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime()) && date.toISOString().startsWith(val)
      },
      {
        message: '無效的日期',
      },
    ),
  symptoms: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  prescription: z.string().trim().optional(),
  image_url: z.array(z.url({ message: 'image_url 必須是有效網址' })).optional(),
})

export const updateRecordSchema = z
  .object({
    pet_id: z
      .number({ error: '寵物 ID 必須是數字' })
      .int({ message: '寵物 ID 必須是整數' })
      .positive({ message: '寵物 ID 必須大於 0' })
      .optional(),
    record_type: z
      .enum(RECORD_TYPES, {
        error: '請選擇正確的紀錄類型',
      })
      .optional(),
    hospital_name: z.string().trim().max(100, { message: '醫院名稱過長' }).optional(),
    title: z
      .string({ error: '請填寫標題' })
      .trim()
      .min(1, { message: '標題不能為空白' })
      .max(200, { message: '標題過長' })
      .optional(),
    record_date: z
      .string()
      .regex(dateRegex, { message: '請輸入正確的日期格式 (YYYY-MM-DD)' })
      .refine(
        (val) => {
          const date = new Date(val)
          return !isNaN(date.getTime()) && date.toISOString().startsWith(val)
        },
        {
          message: '無效的日期',
        },
      )
      .optional(),
    symptoms: z.string().trim().optional(),
    diagnosis: z.string().trim().optional(),
    prescription: z.string().trim().optional(),
    image_url: z.array(z.url({ message: 'image_url 必須是有效網址' })).optional(),
    [MEDICAL_IMAGE_UPLOAD_INTENT_FIELD]: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: '請至少提供一個欄位進行修改',
  })
