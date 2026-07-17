import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pool } from '../src/config/db.js'
import {
  createHospitalReview,
  deleteMyHospitalReview,
  DuplicateHospitalReviewError,
  findHospitalReviewSummary,
  HospitalNotFoundError,
  HospitalReviewNotFoundError,
  listHospitalReviews,
  updateMyHospitalReview,
} from '../src/services/hospital_reviews.service.js'

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

test('listHospitalReviews returns paginated public reviews with user metadata', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /INNER JOIN users/)
    assert.match(text, /LIMIT \$2/)
    assert.match(text, /OFFSET \$3/)
    assert.deepEqual(values, [15, 25, 25])
    return {
      rows: [
        {
          id: 9,
          hospital_id: 15,
          user_id: 7,
          user_name: 'Alice',
          user_avatar_url: 'avatar.png',
          rating: '5',
          comment: 'Careful doctor',
          created_at: '2026-07-13T10:00:00.000Z',
          updated_at: '2026-07-13T10:00:00.000Z',
        },
      ],
    }
  })

  assert.deepEqual(await listHospitalReviews(15, { page: 2, limit: 25 }), [
    {
      id: 9,
      hospital_id: 15,
      user_id: 7,
      user_name: 'Alice',
      user_avatar_url: 'avatar.png',
      rating: 5,
      comment: 'Careful doctor',
      created_at: '2026-07-13T10:00:00.000Z',
      updated_at: '2026-07-13T10:00:00.000Z',
    },
  ])
})

test('createHospitalReview inserts one review for the current user', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /INSERT INTO hospital_reviews/)
    assert.deepEqual(values, [15, 7, 5, 'Careful doctor'])
    return {
      rows: [
        {
          id: 9,
          hospital_id: 15,
          user_id: 7,
          rating: '5',
          comment: 'Careful doctor',
          created_at: '2026-07-13T10:00:00.000Z',
          updated_at: '2026-07-13T10:00:00.000Z',
        },
      ],
    }
  })

  assert.deepEqual(await createHospitalReview(15, 7, { rating: 5, comment: 'Careful doctor' }), {
    id: 9,
    hospital_id: 15,
    user_id: 7,
    rating: 5,
    comment: 'Careful doctor',
    created_at: '2026-07-13T10:00:00.000Z',
    updated_at: '2026-07-13T10:00:00.000Z',
  })
})

test('createHospitalReview maps unique constraint violation to DuplicateHospitalReviewError', async (t) => {
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

test('createHospitalReview maps missing hospital foreign key to HospitalNotFoundError', async (t) => {
  t.mock.method(pool, 'query', async () => {
    const error = new Error('missing hospital')
    error.code = '23503'
    error.constraint = 'fk_hospital_reviews_hospital'
    throw error
  })

  await assert.rejects(
    () => createHospitalReview(999, 7, { rating: 5, comment: 'Careful doctor' }),
    HospitalNotFoundError,
  )
})

test('updateMyHospitalReview updates by hospital and current user', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /UPDATE hospital_reviews/)
    assert.match(text, /WHERE hospital_id = \$3/)
    assert.match(text, /AND user_id = \$4/)
    assert.deepEqual(values, [4, 'Long wait', 15, 7])
    return {
      rows: [
        {
          id: 9,
          hospital_id: 15,
          user_id: 7,
          rating: '4',
          comment: 'Long wait',
          created_at: '2026-07-13T10:00:00.000Z',
          updated_at: '2026-07-13T11:00:00.000Z',
        },
      ],
    }
  })

  assert.deepEqual(await updateMyHospitalReview(15, 7, { rating: 4, comment: 'Long wait' }), {
    id: 9,
    hospital_id: 15,
    user_id: 7,
    rating: 4,
    comment: 'Long wait',
    created_at: '2026-07-13T10:00:00.000Z',
    updated_at: '2026-07-13T11:00:00.000Z',
  })
})

test('updateMyHospitalReview throws when the current user has no review', async (t) => {
  t.mock.method(pool, 'query', async () => ({ rows: [] }))

  await assert.rejects(
    () => updateMyHospitalReview(15, 7, { rating: 4, comment: 'Long wait' }),
    HospitalReviewNotFoundError,
  )
})

test('deleteMyHospitalReview deletes by hospital and current user', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /DELETE FROM hospital_reviews/)
    assert.match(text, /WHERE hospital_id = \$1/)
    assert.match(text, /AND user_id = \$2/)
    assert.deepEqual(values, [15, 7])
    return { rowCount: 1 }
  })

  assert.equal(await deleteMyHospitalReview(15, 7), true)
})

test('deleteMyHospitalReview throws when the current user has no review', async (t) => {
  t.mock.method(pool, 'query', async () => ({ rowCount: 0 }))

  await assert.rejects(
    () => deleteMyHospitalReview(15, 7),
    HospitalReviewNotFoundError,
  )
})
