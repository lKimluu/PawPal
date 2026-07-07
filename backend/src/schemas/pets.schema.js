import { z } from 'zod'
import { PET_AVATAR_UPLOAD_INTENT_FIELD } from '../middlewares/upload_image.js'

const createRequiredMessage = '寵物名稱與物種為必填欄位'

function requiredStringField(message, maxLength, tooLongMessage) {
  return z
    .string({ error: message })
    .trim()
    .min(1, { error: message })
    .max(maxLength, { error: tooLongMessage })
}

function optionalStringField(maxLength, typeMessage, tooLongMessage) {
  return z
    .string({ error: typeMessage })
    .trim()
    .max(maxLength, { error: tooLongMessage })
    .optional()
}

function optionalTextField() {
  return z.string({ error: '備註格式不正確' }).trim().optional()
}

function optionalUrlField() {
  return z.string({ error: '寵物照片網址格式不正確' }).trim().optional()
}

function optionalDateField() {
  return z
    .string({ error: '生日格式錯誤，請使用 YYYY-MM-DD' })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: '生日格式錯誤，請使用 YYYY-MM-DD' })
    .optional()
}

const petFieldsSchema = {
  name: optionalStringField(100, '寵物名稱格式不正確', '寵物名稱長度過長').refine((value) => value !== '', {
    error: '寵物名稱不可為空白',
  }),
  species: optionalStringField(50, '物種格式不正確', '物種字數過長').refine((value) => value !== '', {
    error: '物種不可為空白',
  }),
  breed: optionalStringField(100, '品種格式不正確', '品種長度過長'),
  gender: optionalStringField(20, '性別格式不正確', '性別長度過長'),
  birthday: optionalDateField(),
  weight: z.number({ error: '體重格式不正確' }).nonnegative().optional(),
  microchip_number: optionalStringField(50, '晶片號碼格式不正確', '晶片號碼長度過長'),
  neutered: z.boolean({ error: '結紮狀態格式不正確' }).optional(),
  blood_type: optionalStringField(20, '血型格式不正確', '血型長度過長'),
  fur_color: optionalStringField(100, '毛色格式不正確', '毛色長度過長'),
  notes: optionalTextField(),
  avatar_url: optionalUrlField(),
}

export const createPetSchema = z.object({
  ...petFieldsSchema,
  name: requiredStringField(createRequiredMessage, 100, '寵物名稱長度過長'),
  species: requiredStringField(createRequiredMessage, 50, '物種字數過長'),
})

export const updatePetSchema = z
  .object({
    ...petFieldsSchema,
    [PET_AVATAR_UPLOAD_INTENT_FIELD]: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    error: '請至少提供一個寵物欄位',
  })
