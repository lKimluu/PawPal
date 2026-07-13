import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  hospitalReviewBodySchema,
  hospitalReviewParamsSchema,
} from '../src/schemas/hospital_reviews.schema.js'

test('醫院評論 params schema 應轉換正整數 hospital_id', () => {
  const result = hospitalReviewParamsSchema.safeParse({ hospital_id: '15' })

  assert.equal(result.success, true)
  assert.equal(result.data.hospital_id, 15)
})

test('醫院評論 params schema 應拒絕無效 hospital_id', () => {
  const result = hospitalReviewParamsSchema.safeParse({ hospital_id: '0' })

  assert.equal(result.success, false)
  assert.equal(result.error.issues[0]?.message, '醫院編號格式不正確')
})

test('醫院評論 body schema 應接受 1 到 5 分並修剪評論', () => {
  const result = hospitalReviewBodySchema.safeParse({
    rating: '5',
    comment: ' Careful doctor ',
  })

  assert.equal(result.success, true)
  assert.deepEqual(result.data, {
    rating: 5,
    comment: 'Careful doctor',
  })
})

test('醫院評論 body schema 應拒絕無效評分與空白評論', () => {
  const ratingResult = hospitalReviewBodySchema.safeParse({
    rating: '6',
    comment: 'Careful doctor',
  })
  const commentResult = hospitalReviewBodySchema.safeParse({
    rating: '5',
    comment: '   ',
  })

  assert.equal(ratingResult.success, false)
  assert.equal(ratingResult.error.issues[0]?.message, '評分必須介於 1 到 5 之間')
  assert.equal(commentResult.success, false)
  assert.equal(commentResult.error.issues[0]?.message, '評論內容不可空白')
})

test('醫院評論 body schema 應拒絕超過 1000 字評論', () => {
  const result = hospitalReviewBodySchema.safeParse({
    rating: 5,
    comment: 'a'.repeat(1001),
  })

  assert.equal(result.success, false)
  assert.equal(result.error.issues[0]?.message, '評論內容不可超過 1000 字')
})
