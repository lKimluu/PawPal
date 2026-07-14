import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pool } from '../src/config/db.js'
import {
  createHospitalReview,
  deleteHospitalReview,
  findHospitalReviews,
  findHospitalReviewSummary,
  hospitalExists,
  updateHospitalReview,
} from '../src/services/hospital_reviews.service.js'

test('hospitalExists checks whether the hospital id is present', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /SELECT EXISTS/)
    assert.match(text, /FROM hospitals/)
    assert.deepEqual(values, [12])
    return { rows: [{ exists: true }] }
  })

  assert.equal(await hospitalExists(12), true)
})

test('findHospitalReviewSummary returns average rating and review count', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /AVG\(rating\)/)
    assert.match(text, /COUNT\(\*\)::int AS review_count/)
    assert.deepEqual(values, [7])
    return { rows: [{ average_rating: '4.3', review_count: 3 }] }
  })

  assert.deepEqual(await findHospitalReviewSummary(7), {
    average_rating: 4.3,
    review_count: 3,
  })
})

test('findHospitalReviewSummary returns zero summary when there are no reviews', async (t) => {
  t.mock.method(pool, 'query', async () => ({
    rows: [{ average_rating: null, review_count: 0 }],
  }))

  assert.deepEqual(await findHospitalReviewSummary(7), {
    average_rating: 0,
    review_count: 0,
  })
})

test('findHospitalReviews lists newest reviews for a hospital', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /FROM hospital_reviews/)
    assert.match(text, /LEFT JOIN users AS u ON u\.id = hr\.user_id/)
    assert.match(text, /WHERE hr\.hospital_id = \$1/)
    assert.match(text, /ORDER BY hr\.created_at DESC/)
    assert.deepEqual(values, [7])
    return {
      rows: [
        {
          id: 9,
          hospital_id: 7,
          user_id: 2,
          user_name: '小明',
          rating: 5,
          comment: '醫師親切',
          created_at: '2026-07-14T09:00:00.000Z',
          updated_at: '2026-07-14T09:00:00.000Z',
        },
      ],
    }
  })

  assert.deepEqual(await findHospitalReviews(7), [
    {
      id: 9,
      hospital_id: 7,
      user_id: 2,
      user_name: '小明',
      rating: 5,
      comment: '醫師親切',
      created_at: '2026-07-14T09:00:00.000Z',
      updated_at: '2026-07-14T09:00:00.000Z',
    },
  ])
})

test('createHospitalReview inserts the user review and returns the created row', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /INSERT INTO hospital_reviews/)
    assert.match(text, /RETURNING/)
    assert.deepEqual(values, [7, 2, 4, '整體服務良好'])
    return {
      rows: [
        {
          id: 10,
          hospital_id: 7,
          user_id: 2,
          user_name: '',
          rating: 4,
          comment: '整體服務良好',
          created_at: '2026-07-14T09:00:00.000Z',
          updated_at: '2026-07-14T09:00:00.000Z',
        },
      ],
    }
  })

  assert.deepEqual(
    await createHospitalReview({
      hospitalId: 7,
      userId: 2,
      rating: 4,
      comment: '整體服務良好',
    }),
    {
      id: 10,
      hospital_id: 7,
      user_id: 2,
      user_name: '',
      rating: 4,
      comment: '整體服務良好',
      created_at: '2026-07-14T09:00:00.000Z',
      updated_at: '2026-07-14T09:00:00.000Z',
    },
  )
})

test('updateHospitalReview updates only the owner review and returns the row', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /UPDATE hospital_reviews/)
    assert.match(text, /WHERE id = \$3/)
    assert.match(text, /hospital_id = \$4/)
    assert.match(text, /user_id = \$5/)
    assert.deepEqual(values, [3, 'updated comment', 11, 7, 2])
    return {
      rows: [
        {
          id: 11,
          hospital_id: 7,
          user_id: 2,
          user_name: '',
          rating: 3,
          comment: 'updated comment',
          created_at: '2026-07-14T09:00:00.000Z',
          updated_at: '2026-07-14T10:00:00.000Z',
        },
      ],
    }
  })

  assert.deepEqual(
    await updateHospitalReview({
      reviewId: 11,
      hospitalId: 7,
      userId: 2,
      rating: 3,
      comment: 'updated comment',
    }),
    {
      id: 11,
      hospital_id: 7,
      user_id: 2,
      user_name: '',
      rating: 3,
      comment: 'updated comment',
      created_at: '2026-07-14T09:00:00.000Z',
      updated_at: '2026-07-14T10:00:00.000Z',
    },
  )
})

test('deleteHospitalReview deletes only the owner review and reports success', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /DELETE FROM hospital_reviews/)
    assert.match(text, /WHERE id = \$1/)
    assert.match(text, /hospital_id = \$2/)
    assert.match(text, /user_id = \$3/)
    assert.deepEqual(values, [11, 7, 2])
    return { rowCount: 1 }
  })

  assert.equal(
    await deleteHospitalReview({
      reviewId: 11,
      hospitalId: 7,
      userId: 2,
    }),
    true,
  )
})
