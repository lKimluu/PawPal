import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createHospitalReviewsController } from '../src/controllers/hospital_reviews.controller.js'
import {
  DuplicateHospitalReviewError,
  HospitalNotFoundError,
  HospitalReviewNotFoundError,
} from '../src/services/hospital_reviews.service.js'

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
    send(payload = null) {
      this.body = payload
      return this
    },
  }
}

test('listHospitalReviews 成功時應回傳公開評論列表', async () => {
  const reviews = [
    {
      id: 2,
      hospital_id: 15,
      user_id: 7,
      user_name: 'Alice',
      user_avatar_url: null,
      rating: 5,
      comment: 'Careful doctor',
      created_at: '2026-07-13T10:00:00.000Z',
      updated_at: '2026-07-13T10:00:00.000Z',
    },
  ]
  const { listHospitalReviews } = createHospitalReviewsController({
    listHospitalReviews: async (hospitalId, pagination) => {
      assert.equal(hospitalId, 15)
      assert.deepEqual(pagination, { page: 1, limit: 50 })
      return reviews
    },
  })
  const res = createResponse()

  await listHospitalReviews({
    params: { hospital_id: 15 },
    validated_query: { page: 1, limit: 50 },
  }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { reviews })
})

test('listHospitalReviews 發生非預期錯誤時應回傳 500 message', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { listHospitalReviews } = createHospitalReviewsController({
    listHospitalReviews: async () => {
      throw new Error('database down')
    },
  })
  const res = createResponse()

  await listHospitalReviews({ params: { hospital_id: 15 } }, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '取得醫院評論失敗，請稍後再試' })
})

test('createHospitalReview 成功時應以目前會員建立評論並回傳 201', async () => {
  const review = { id: 3, hospital_id: 15, user_id: 7, rating: 5, comment: 'Careful doctor' }
  const { createHospitalReview } = createHospitalReviewsController({
    createHospitalReview: async (hospitalId, userId, body) => {
      assert.equal(hospitalId, 15)
      assert.equal(userId, 7)
      assert.deepEqual(body, { rating: 5, comment: 'Careful doctor' })
      return review
    },
  })
  const res = createResponse()

  await createHospitalReview({
    params: { hospital_id: 15 },
    userId: 7,
    body: { rating: 5, comment: 'Careful doctor' },
  }, res)

  assert.equal(res.statusCode, 201)
  assert.deepEqual(res.body, { review })
})

test('createHospitalReview 重複評論時應回傳 409', async () => {
  const { createHospitalReview } = createHospitalReviewsController({
    createHospitalReview: async () => {
      throw new DuplicateHospitalReviewError()
    },
  })
  const res = createResponse()

  await createHospitalReview({
    params: { hospital_id: 15 },
    userId: 7,
    body: { rating: 5, comment: 'Careful doctor' },
  }, res)

  assert.equal(res.statusCode, 409)
  assert.deepEqual(res.body, { message: '你已經評論過這間醫院' })
})

test('createHospitalReview 醫院不存在時應回傳 404', async () => {
  const { createHospitalReview } = createHospitalReviewsController({
    createHospitalReview: async () => {
      throw new HospitalNotFoundError()
    },
  })
  const res = createResponse()

  await createHospitalReview({
    params: { hospital_id: 9999 },
    userId: 7,
    body: { rating: 5, comment: 'Careful doctor' },
  }, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到醫院' })
})

test('updateMyHospitalReview 成功時應更新目前會員評論並回傳 200', async () => {
  const review = { id: 3, hospital_id: 15, user_id: 7, rating: 4, comment: 'Long wait' }
  const { updateMyHospitalReview } = createHospitalReviewsController({
    updateMyHospitalReview: async (hospitalId, userId, body) => {
      assert.equal(hospitalId, 15)
      assert.equal(userId, 7)
      assert.deepEqual(body, { rating: 4, comment: 'Long wait' })
      return review
    },
  })
  const res = createResponse()

  await updateMyHospitalReview({
    params: { hospital_id: 15 },
    userId: 7,
    body: { rating: 4, comment: 'Long wait' },
  }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { review })
})

test('deleteMyHospitalReview 成功時應刪除目前會員評論並回傳 204', async () => {
  const { deleteMyHospitalReview } = createHospitalReviewsController({
    deleteMyHospitalReview: async (hospitalId, userId) => {
      assert.equal(hospitalId, 15)
      assert.equal(userId, 7)
      return true
    },
  })
  const res = createResponse()

  await deleteMyHospitalReview({ params: { hospital_id: 15 }, userId: 7 }, res)

  assert.equal(res.statusCode, 204)
  assert.equal(res.body, null)
})

test('updateMyHospitalReview 找不到自己的評論時應回傳 404', async () => {
  const { updateMyHospitalReview } = createHospitalReviewsController({
    updateMyHospitalReview: async () => {
      throw new HospitalReviewNotFoundError()
    },
  })
  const res = createResponse()

  await updateMyHospitalReview({
    params: { hospital_id: 15 },
    userId: 7,
    body: { rating: 4, comment: 'Long wait' },
  }, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到你的醫院評論' })
})

test('deleteMyHospitalReview 找不到自己的評論時應回傳 404', async () => {
  const { deleteMyHospitalReview } = createHospitalReviewsController({
    deleteMyHospitalReview: async () => {
      throw new HospitalReviewNotFoundError()
    },
  })
  const res = createResponse()

  await deleteMyHospitalReview({ params: { hospital_id: 15 }, userId: 7 }, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到你的醫院評論' })
})
