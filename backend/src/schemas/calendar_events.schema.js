import { z } from 'zod'

const VALID_TYPES = ['vet', 'vaccine', 'grooming', 'medication', 'bath', 'training', 'other']

const typeField = z.enum(VALID_TYPES, {
  error: () => `行程類型必須為：${VALID_TYPES.join(', ')}`,
})

const notesField = z.string().max(100, { error: '備註過長，請重新輸入' }).optional()

const eventTimeField = z
  .string()
  .regex(/^\d{2}:\d{2}$/, { error: '請輸入正確的時間格式（HH:MM）' })
  .optional()

const eventDateField = z
  .string({ error: '日期為必填' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: '請輸入正確的日期格式（YYYY-MM-DD）' })

export const createCalendarEventSchema = z.object({
  pet_id: z.number({ error: '寵物 ID 為必填' }).int().positive({ error: '寵物 ID 必須為正整數' }),
  title: z
    .string({ error: '行程標題為必填' })
    .trim()
    .min(1, { error: '行程標題不得為空' })
    .max(255, { error: '行程標題過長，請重新輸入' }),
  event_date: eventDateField,
  event_time: eventTimeField,
  type: typeField,
  location: z.string().max(255, { error: '行程地點過長，請重新輸入' }).optional(),
  notes: notesField,
})

export const calendarEventParamsSchema = z.object({
  id: z.coerce.number().int().positive({ error: '行程 ID 必須為正整數' }),
})

export const updateCalendarEventSchema = z
  .object({
    title: z.string().trim().min(1, { error: '行程標題不得為空' }).optional(),
    event_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: '請輸入正確的日期格式（YYYY-MM-DD）' })
      .optional(),
    event_time: eventTimeField,
    type: typeField.optional(),
    location: z.string().max(255, { error: '行程地點過長，請重新輸入' }).optional(),
    notes: notesField,
    is_completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: '請至少提供一個要更新的欄位' })
