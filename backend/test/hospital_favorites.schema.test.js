import assert from 'node:assert/strict'
import { test } from 'node:test'

import { hospitalFavoriteParamsSchema } from '../src/schemas/hospital_favorites.schema.js'

test('醫院收藏 params schema 應轉換正整數 hospital_id', () => {
  const result = hospitalFavoriteParamsSchema.safeParse({ hospital_id: '15' })

  assert.equal(result.success, true)
  assert.equal(result.data.hospital_id, 15)
})

test('醫院收藏 params schema 應拒絕無效 hospital_id', () => {
  const zeroResult = hospitalFavoriteParamsSchema.safeParse({ hospital_id: '0' })
  const nonNumericResult = hospitalFavoriteParamsSchema.safeParse({ hospital_id: 'abc' })

  assert.equal(zeroResult.success, false)
  assert.equal(zeroResult.error.issues[0]?.message, '醫院編號格式不正確')
  assert.equal(nonNumericResult.success, false)
  assert.equal(nonNumericResult.error.issues[0]?.message, '醫院編號格式不正確')
})
