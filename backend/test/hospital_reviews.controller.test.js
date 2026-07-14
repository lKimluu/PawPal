import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createHospitalReviewsController } from '../src/controllers/hospital_reviews.controller.js'

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

test('listHospitalReviews returns summary and reviews for an existing hospital', async () => {
  const controller = createHospitalReviewsController({
    hospitalExists: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return true
    },
    findHospitalReviewSummary: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return { average_rating: 4.2, review_count: 8 }
    },
    findHospitalReviews: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return [{ id: 1, rating: 4, comment: 'good' }]
    },
  })
  const res = createResponse()

  await controller.listHospitalReviews({ params: { hospitalId: '7' } }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, {
    summary: { average_rating: 4.2, review_count: 8 },
    reviews: [{ id: 1, rating: 4, comment: 'good' }],
  })
})

test('createHospitalReview returns the created review and refreshed summary', async () => {
  const controller = createHospitalReviewsController({
    hospitalExists: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return true
    },
    createHospitalReview: async (payload) => {
      assert.deepEqual(payload, {
        hospitalId: 7,
        userId: 2,
        rating: 5,
        comment: '醫師親切',
      })
      return { id: 12, hospital_id: 7, user_id: 2, rating: 5, comment: '醫師親切' }
    },
    findHospitalReviewSummary: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return { average_rating: 4.5, review_count: 9 }
    },
  })
  const res = createResponse()

  await controller.createHospitalReview(
    { params: { hospitalId: '7' }, userId: 2, body: { rating: 5, comment: '醫師親切' } },
    res,
  )

  assert.equal(res.statusCode, 201)
  assert.deepEqual(res.body, {
    message: '評論已送出',
    review: { id: 12, hospital_id: 7, user_id: 2, rating: 5, comment: '醫師親切' },
    summary: { average_rating: 4.5, review_count: 9 },
  })
})

test('createHospitalReview returns 404 when hospital does not exist', async () => {
  const controller = createHospitalReviewsController({
    hospitalExists: async () => false,
    createHospitalReview: async () => {
      throw new Error('createHospitalReview should not be called')
    },
  })
  const res = createResponse()

  await controller.createHospitalReview(
    { params: { hospitalId: '999' }, userId: 2, body: { rating: 5, comment: '醫師親切' } },
    res,
  )

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到醫院資料' })
})
test('updateHospitalReview returns updated review and refreshed summary', async () => {
  const controller = createHospitalReviewsController({
    hospitalExists: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return true
    },
    updateHospitalReview: async (payload) => {
      assert.deepEqual(payload, {
        reviewId: 12,
        hospitalId: 7,
        userId: 2,
        rating: 4,
        comment: 'updated comment',
      })
      return { id: 12, hospital_id: 7, user_id: 2, rating: 4, comment: 'updated comment' }
    },
    findHospitalReviewSummary: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return { average_rating: 4.1, review_count: 2 }
    },
  })
  const res = createResponse()

  await controller.updateHospitalReview(
    {
      params: { hospitalId: '7', reviewId: '12' },
      userId: 2,
      body: { rating: 4, comment: 'updated comment' },
    },
    res,
  )

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, {
    message: '評論已更新',
    review: { id: 12, hospital_id: 7, user_id: 2, rating: 4, comment: 'updated comment' },
    summary: { average_rating: 4.1, review_count: 2 },
  })
})

test('updateHospitalReview returns 404 when review is not owned by the user', async () => {
  const controller = createHospitalReviewsController({
    hospitalExists: async () => true,
    updateHospitalReview: async () => null,
  })
  const res = createResponse()

  await controller.updateHospitalReview(
    {
      params: { hospitalId: '7', reviewId: '12' },
      userId: 2,
      body: { rating: 4, comment: 'updated comment' },
    },
    res,
  )

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到可修改的評論' })
})

test('deleteHospitalReview deletes owner review and returns refreshed summary', async () => {
  const controller = createHospitalReviewsController({
    hospitalExists: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return true
    },
    deleteHospitalReview: async (payload) => {
      assert.deepEqual(payload, {
        reviewId: 12,
        hospitalId: 7,
        userId: 2,
      })
      return true
    },
    findHospitalReviewSummary: async (hospitalId) => {
      assert.equal(hospitalId, 7)
      return { average_rating: 3.5, review_count: 1 }
    },
  })
  const res = createResponse()

  await controller.deleteHospitalReview({ params: { hospitalId: '7', reviewId: '12' }, userId: 2 }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, {
    message: '評論已刪除',
    summary: { average_rating: 3.5, review_count: 1 },
  })
})
