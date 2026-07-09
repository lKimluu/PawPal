import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createHospitalsController } from '../src/controllers/hospitals.controller.js'

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

test('listHospitals 成功時應回傳 hospitals 與 pagination', async () => {
  const payload = {
    hospitals: [{ id: 1, name: '仁愛動物醫院' }],
    pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
  }
  const { listHospitals } = createHospitalsController({
    findHospitals: async (query) => {
      assert.deepEqual(query, { keyword: '仁愛', page: 1, limit: 20 })
      return payload
    },
  })
  const res = createResponse()

  await listHospitals(
    {
      query: { keyword: 'unparsed' },
      validated_query: { keyword: '仁愛', page: 1, limit: 20 },
    },
    res,
  )

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, payload)
})

test('listNearbyHospitals 成功時應回傳 hospitals', async () => {
  const hospitals = [{ id: 1, name: '仁愛動物醫院', distance_km: 1.23 }]
  const { listNearbyHospitals } = createHospitalsController({
    findNearbyHospitals: async (query) => {
      assert.deepEqual(query, { lat: 25, lng: 121, radius: 5, limit: 20 })
      return hospitals
    },
  })
  const res = createResponse()

  await listNearbyHospitals(
    {
      query: { lat: 'unparsed' },
      validated_query: { lat: 25, lng: 121, radius: 5, limit: 20 },
    },
    res,
  )

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { hospitals })
})

test('listHospitals 沒有 validated_query 時應 fallback 使用 req.query', async () => {
  const payload = {
    hospitals: [],
    pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
  }
  const { listHospitals } = createHospitalsController({
    findHospitals: async (query) => {
      assert.deepEqual(query, { page: 1, limit: 20 })
      return payload
    },
  })
  const res = createResponse()

  await listHospitals({ query: { page: 1, limit: 20 } }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, payload)
})

test('listHospitals 發生非預期錯誤時應回傳 500 message', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { listHospitals } = createHospitalsController({
    findHospitals: async () => {
      throw new Error('database down')
    },
  })
  const res = createResponse()

  await listHospitals({ query: {} }, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '取得醫院清單失敗，請稍後再試' })
})

test('listNearbyHospitals 發生非預期錯誤時應回傳 500 message', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { listNearbyHospitals } = createHospitalsController({
    findNearbyHospitals: async () => {
      throw new Error('database down')
    },
  })
  const res = createResponse()

  await listNearbyHospitals({ query: {} }, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '取得附近醫院失敗，請稍後再試' })
})
