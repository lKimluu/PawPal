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

const latitude_schema = z.coerce.number({ error: '緯度格式不正確' }).min(-90, {
  error: '緯度必須介於 -90 到 90 之間',
}).max(90, { error: '緯度必須介於 -90 到 90 之間' })
const longitude_schema = z.coerce.number({ error: '經度格式不正確' }).min(-180, {
  error: '經度必須介於 -180 到 180 之間',
}).max(180, { error: '經度必須介於 -180 到 180 之間' })
function optional_boolean_schema(message) {
  return z.preprocess((value) => {
    if (value === undefined || value === '') return undefined
    if (value === 'true' || value === true) return true
    if (value === 'false' || value === false) return false
    return value
  }, z.boolean({ error: message }).optional())
}

export const hospitalsQuerySchema = z.object({
  keyword: optional_trimmed_string('關鍵字格式不正確'),
  city: optional_trimmed_string('縣市格式不正確'),
  district: optional_trimmed_string('行政區格式不正確'),
  animal_type: animal_type_schema,
  is_24h: optional_boolean_schema('24 小時營業格式不正確'),
  favorites_only: optional_boolean_schema('收藏清單格式不正確'),
  sort: z.enum(['relevance', 'distance', 'name'], {
    error: '排序方式必須是 relevance、distance 或 name',
  }).optional(),
  lat: latitude_schema.optional(),
  lng: longitude_schema.optional(),
  page: page_schema,
  limit: limit_schema,
}).superRefine((value, context) => {
  if (value.sort === 'distance' && (value.lat === undefined || value.lng === undefined)) {
    context.addIssue({ code: 'custom', path: ['sort'], message: '距離排序需要有效的緯度與經度' })
  }
  if ((value.lat === undefined) !== (value.lng === undefined)) {
    context.addIssue({ code: 'custom', path: ['lat'], message: '緯度與經度必須一起提供' })
  }
})

export const nearbyHospitalsQuerySchema = z.object({
  lat: latitude_schema,
  lng: longitude_schema,
  radius: z.coerce
    .number({ error: '搜尋半徑格式不正確' })
    .positive({ error: '搜尋半徑必須大於 0' })
    .max(50, { error: '搜尋半徑不可超過 50 公里' })
    .default(5),
  limit: limit_schema,
  animal_type: animal_type_schema,
})

export const hospitalMapQuerySchema = z.object({
  north: latitude_schema,
  south: latitude_schema,
  east: longitude_schema,
  west: longitude_schema,
}).superRefine((value, context) => {
  if (value.north <= value.south) {
    context.addIssue({ code: 'custom', path: ['north'], message: '北側緯度必須大於南側緯度' })
  }
  if (value.east <= value.west) {
    context.addIssue({ code: 'custom', path: ['east'], message: '東側經度必須大於西側經度' })
  }
})
