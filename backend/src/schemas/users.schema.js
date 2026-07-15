import { z } from 'zod'
import { USER_AVATAR_UPLOAD_INTENT_FIELD } from '../middlewares/upload_image.js'

function optionalProfileString(maxLength, typeMessage, tooLongMessage) {
  return z.string({ error: typeMessage }).trim().max(maxLength, { error: tooLongMessage }).optional()
}

export const updateCurrentUserSchema = z
  .object({
    name: optionalProfileString(100, '姓名格式不正確', '姓名長度不可超過 100 字').refine(
      (value) => value === undefined || value !== '',
      {
        error: '姓名不可為空',
      },
    ),
    avatar_url: optionalProfileString(
      2048,
      '會員照片網址格式不正確',
      '會員照片網址長度不可超過 2048 字',
    ),
    [USER_AVATAR_UPLOAD_INTENT_FIELD]: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    error: '請提供要修改的會員資料',
  })
