import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createHospitalFavoritesController } from '../src/controllers/hospital_favorites.controller.js'
import {
  DuplicateHospitalFavoriteError,
  HospitalFavoriteNotFoundError,
  HospitalNotFoundError,
} from '../src/services/hospital_favorites.service.js'

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

test('addHospitalFavorite 成功時應回傳 201', async () => {
  const { addHospitalFavorite } = createHospitalFavoritesController({
    addHospitalFavorite: async (hospitalId, userId) => {
      assert.equal(hospitalId, 15)
      assert.equal(userId, 7)
    },
  })
  const res = createResponse()

  await addHospitalFavorite({ params: { hospital_id: 15 }, userId: 7 }, res)

  assert.equal(res.statusCode, 201)
  assert.deepEqual(res.body, { message: '已加入收藏' })
})

test('addHospitalFavorite 重複收藏時應回傳 409', async () => {
  const { addHospitalFavorite } = createHospitalFavoritesController({
    addHospitalFavorite: async () => {
      throw new DuplicateHospitalFavoriteError()
    },
  })
  const res = createResponse()

  await addHospitalFavorite({ params: { hospital_id: 15 }, userId: 7 }, res)

  assert.equal(res.statusCode, 409)
  assert.deepEqual(res.body, { message: '此醫院已收藏' })
})

test('addHospitalFavorite 醫院不存在時應回傳 404', async () => {
  const { addHospitalFavorite } = createHospitalFavoritesController({
    addHospitalFavorite: async () => {
      throw new HospitalNotFoundError()
    },
  })
  const res = createResponse()

  await addHospitalFavorite({ params: { hospital_id: 9999 }, userId: 7 }, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到這間醫院' })
})

test('addHospitalFavorite 發生非預期錯誤時應回傳 500', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { addHospitalFavorite } = createHospitalFavoritesController({
    addHospitalFavorite: async () => {
      throw new Error('database down')
    },
  })
  const res = createResponse()

  await addHospitalFavorite({ params: { hospital_id: 15 }, userId: 7 }, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '收藏醫院失敗，請稍後再試' })
})

test('removeHospitalFavorite 成功時應回傳 200', async () => {
  const { removeHospitalFavorite } = createHospitalFavoritesController({
    removeHospitalFavorite: async (hospitalId, userId) => {
      assert.equal(hospitalId, 15)
      assert.equal(userId, 7)
      return true
    },
  })
  const res = createResponse()

  await removeHospitalFavorite({ params: { hospital_id: 15 }, userId: 7 }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { message: '已取消收藏' })
})

test('removeHospitalFavorite 收藏不存在時應回傳 404', async () => {
  const { removeHospitalFavorite } = createHospitalFavoritesController({
    removeHospitalFavorite: async () => {
      throw new HospitalFavoriteNotFoundError()
    },
  })
  const res = createResponse()

  await removeHospitalFavorite({ params: { hospital_id: 15 }, userId: 7 }, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '此收藏不存在，請重新確認' })
})

test('removeHospitalFavorite 發生非預期錯誤時應回傳 500', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { removeHospitalFavorite } = createHospitalFavoritesController({
    removeHospitalFavorite: async () => {
      throw new Error('database down')
    },
  })
  const res = createResponse()

  await removeHospitalFavorite({ params: { hospital_id: 15 }, userId: 7 }, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '取消收藏失敗，請稍後再試' })
})
