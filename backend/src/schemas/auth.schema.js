import { z } from 'zod'

const registerRequiredMessage = '姓名、Email、密碼為必填欄位'
const registerTypeMessage = '姓名、Email、密碼格式不正確'
const loginRequiredMessage = 'Email、密碼為必填欄位'
const loginTypeMessage = 'Email、密碼格式不正確'
const googleRequiredMessage = '缺少 Google 驗證憑證 (ID Token)'
const googleTypeMessage = 'Google 驗證憑證格式不正確'

function stringFieldError(requiredMessage, typeMessage) {
  return (issue) => (issue.input === undefined ? requiredMessage : typeMessage)
}

function createEmailField(requiredMessage, typeMessage) {
  return z
    .string({ error: stringFieldError(requiredMessage, typeMessage) })
    .trim()
    .min(1, { error: requiredMessage })
    .max(255, { error: 'Email 長度過長' })
    .email({ error: 'Email 格式錯誤' })
    .transform((value) => value.toLowerCase())
}

function createPasswordField(requiredMessage, typeMessage) {
  return z
    .string({ error: stringFieldError(requiredMessage, typeMessage) })
    .trim()
    .min(1, { error: requiredMessage })
    .max(72, { error: '密碼長度過長' })
}

export const registerSchema = z.object({
  name: z
    .string({ error: stringFieldError(registerRequiredMessage, registerTypeMessage) })
    .trim()
    .min(1, { error: registerRequiredMessage })
    .max(100, { error: '姓名長度過長' }),
  email: createEmailField(registerRequiredMessage, registerTypeMessage),
  password: createPasswordField(registerRequiredMessage, registerTypeMessage),
})

export const loginSchema = z.object({
  email: createEmailField(loginRequiredMessage, loginTypeMessage),
  password: createPasswordField(loginRequiredMessage, loginTypeMessage),
})

export const googleLoginSchema = z.object({
  token: z
    .string({ error: stringFieldError(googleRequiredMessage, googleTypeMessage) })
    .trim()
    .min(1, { error: googleRequiredMessage }),
})
