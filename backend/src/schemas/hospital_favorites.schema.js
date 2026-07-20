import { z } from 'zod'

export const hospitalFavoriteParamsSchema = z.object({
  hospital_id: z.coerce
    .number({ error: '醫院編號格式不正確' })
    .int({ error: '醫院編號格式不正確' })
    .positive({ error: '醫院編號格式不正確' }),
})
