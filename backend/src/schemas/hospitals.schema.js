import { z } from 'zod'

function optional_trimmed_string(message) {
  return z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return value
      }

      const trimmed = value.trim()
      return trimmed === '' ? undefined : trimmed
    },
    z.string({ error: message }).optional(),
  )
}

const animal_type_schema = optional_trimmed_string('診療動物種類格式不正確').refine(
  (value) => value === undefined || /^[a-z][a-z0-9_]*$/.test(value),
  { error: '診療動物種類格式不正確' },
)

const page_schema = z.coerce
  .number({ error: '頁碼格式不正確' })
  .int({ error: '頁碼必須是整數' })
  .min(1, { error: '頁碼必須大於 0' })
  .default(1)

const limit_schema = z.coerce
  .number({ error: '每頁筆數格式不正確' })
  .int({ error: '每頁筆數必須是整數' })
  .min(1, { error: '每頁筆數必須大於 0' })
  .max(100, { error: '每頁筆數不可超過 100' })
  .default(20)

export const hospitalsQuerySchema = z.object({
  keyword: optional_trimmed_string('關鍵字格式不正確'),
  city: optional_trimmed_string('縣市格式不正確'),
  district: optional_trimmed_string('行政區格式不正確'),
  animal_type: animal_type_schema,
  page: page_schema,
  limit: limit_schema,
})

export const nearbyHospitalsQuerySchema = z.object({
  lat: z.coerce
    .number({ error: '緯度格式不正確' })
    .min(-90, { error: '緯度必須介於 -90 到 90 之間' })
    .max(90, { error: '緯度必須介於 -90 到 90 之間' }),
  lng: z.coerce
    .number({ error: '經度格式不正確' })
    .min(-180, { error: '經度必須介於 -180 到 180 之間' })
    .max(180, { error: '經度必須介於 -180 到 180 之間' }),
  radius: z.coerce
    .number({ error: '搜尋半徑格式不正確' })
    .positive({ error: '搜尋半徑必須大於 0' })
    .max(50, { error: '搜尋半徑不可超過 50 公里' })
    .default(5),
  limit: limit_schema,
  animal_type: animal_type_schema,
})
