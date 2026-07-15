import { z } from 'zod'

const connectRequiredMessage = '缺少 Google 授權碼 (Code)'
const connectTypeMessage = 'Google 授權碼格式不正確'

function stringFieldError(requiredMessage, typeMessage) {
  return (issue) => (issue.input === undefined ? requiredMessage : typeMessage)
}

export const connectGoogleCalendarSchema = z.object({
  code: z
    .string({ error: stringFieldError(connectRequiredMessage, connectTypeMessage) })
    .trim()
    .min(1, { error: connectRequiredMessage }),
})
