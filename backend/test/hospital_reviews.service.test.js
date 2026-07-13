import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pool } from '../src/config/db.js'
import {
  createHospitalReview,
  deleteMyHospitalReview,
  DuplicateHospitalReviewError,
  HospitalReviewNotFoundError,
  listHospitalReviews,
  updateMyHospitalReview,
} from '../src/services/hospital_reviews.service.js'

test('listHospitalReviews 應公開回傳指定醫院評論並依建立時間新到舊排序', async (t) => {
  const rows = [
    {
      id: 2,
      hospital_id: 15,
      user_id: 7,
      user_name: 'Alice',
      user_avatar_url: 'https://example.test/avatar.png',
      user_email: 'alice@example.com',
      password: 'secret',
      rating: 5,
      comment: 'Careful doctor',
      created_at: '2026-07-13T10:00:00.000Z',
      updated_at: '2026-07-13T10:00:00.000Z',
    },
  ]
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /FROM hospital_reviews hr/)
    assert.match(text, /INNER JOIN users u/)
    assert.match(text, /WHERE hr\.hospital_id = \$1/)
    assert.match(text, /ORDER BY hr\.created_at DESC/)
    assert.deepEqual(values, [15])
    return { rows }
  })

  const reviews = await listHospitalReviews(15)

  assert.deepEqual(reviews, [
    {
      id: 2,
      hospital_id: 15,
      user_id: 7,
      user_name: 'Alice',
      user_avatar_url: 'https://example.test/avatar.png',
      rating: 5,
      comment: 'Careful doctor',
      created_at: '2026-07-13T10:00:00.000Z',
      updated_at: '2026-07-13T10:00:00.000Z',
    },
  ])
  assert.equal('user_email' in reviews[0], false)
  assert.equal('password' in reviews[0], false)
})

test('createHospitalReview 應建立目前會員對醫院的一則評論', async (t) => {
  const row = {
    id: 3,
    hospital_id: 15,
    user_id: 7,
    rating: 5,
    comment: 'Careful doctor',
    created_at: '2026-07-13T10:00:00.000Z',
    updated_at: '2026-07-13T10:00:00.000Z',
  }
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /INSERT INTO hospital_reviews/)
    assert.match(text, /RETURNING/)
    assert.deepEqual(values, [15, 7, 5, 'Careful doctor'])
    return { rows: [row] }
  })

  const review = await createHospitalReview(15, 7, {
    rating: 5,
    comment: 'Careful doctor',
  })

  assert.deepEqual(review, row)
})

test('createHospitalReview 重複建立同會員同醫院評論時應丟出 DuplicateHospitalReviewError', async (t) => {
  t.mock.method(pool, 'query', async () => {
    const error = new Error('duplicate')
    error.code = '23505'
    error.constraint = 'uq_hospital_reviews_user_hospital'
    throw error
  })

  await assert.rejects(
    () => createHospitalReview(15, 7, { rating: 5, comment: 'Careful doctor' }),
    DuplicateHospitalReviewError,
  )
})

test('updateMyHospitalReview 應只更新目前會員自己的醫院評論', async (t) => {
  const row = {
    id: 3,
    hospital_id: 15,
    user_id: 7,
    rating: 4,
    comment: 'Long wait',
    created_at: '2026-07-13T10:00:00.000Z',
    updated_at: '2026-07-13T11:00:00.000Z',
  }
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /UPDATE hospital_reviews/)
    assert.match(text, /WHERE hospital_id = \$3/)
    assert.match(text, /AND user_id = \$4/)
    assert.match(text, /RETURNING/)
    assert.deepEqual(values, [4, 'Long wait', 15, 7])
    return { rows: [row] }
  })

  const review = await updateMyHospitalReview(15, 7, {
    rating: 4,
    comment: 'Long wait',
  })

  assert.deepEqual(review, row)
})

test('updateMyHospitalReview 找不到自己的評論時應丟出 HospitalReviewNotFoundError', async (t) => {
  t.mock.method(pool, 'query', async () => ({ rows: [] }))

  await assert.rejects(
    () => updateMyHospitalReview(15, 7, { rating: 4, comment: 'Long wait' }),
    HospitalReviewNotFoundError,
  )
})

test('deleteMyHospitalReview 應只刪除目前會員自己的醫院評論', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /DELETE FROM hospital_reviews/)
    assert.match(text, /WHERE hospital_id = \$1/)
    assert.match(text, /AND user_id = \$2/)
    assert.deepEqual(values, [15, 7])
    return { rowCount: 1 }
  })

  const deleted = await deleteMyHospitalReview(15, 7)

  assert.equal(deleted, true)
})

test('deleteMyHospitalReview 找不到自己的評論時應丟出 HospitalReviewNotFoundError', async (t) => {
  t.mock.method(pool, 'query', async () => ({ rowCount: 0 }))

  await assert.rejects(
    () => deleteMyHospitalReview(15, 7),
    HospitalReviewNotFoundError,
  )
})
