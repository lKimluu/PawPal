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
    hospitals: [{ id: 1, name: '仁愛動物醫院', rating_average: 4.5, review_count: 2 }],
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
  const hospitals = [
    { id: 1, name: '仁愛動物醫院', distance_km: 1.23, rating_average: 4.5, review_count: 2 },
  ]
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

test('listHospitals 已登入時應把 userId 傳入 service', async () => {
  const payload = {
    hospitals: [{ id: 1, name: '仁愛動物醫院', is_favorite: true }],
    pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
  }
  const { listHospitals } = createHospitalsController({
    findHospitals: async (query, options) => {
      assert.deepEqual(query, { page: 1, limit: 20 })
      assert.deepEqual(options, { userId: 7 })
      return payload
    },
  })
  const res = createResponse()

  await listHospitals({ validated_query: { page: 1, limit: 20 }, userId: 7 }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, payload)
})

test('listHospitals 帶 favorites_only 但未登入時應回傳 401 且不呼叫 service', async () => {
  let serviceCalled = false
  const { listHospitals } = createHospitalsController({
    findHospitals: async () => {
      serviceCalled = true
      return { hospitals: [], pagination: {} }
    },
  })
  const res = createResponse()

  await listHospitals({ validated_query: { favorites_only: true, page: 1, limit: 20 } }, res)

  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { message: '請先登入後查看收藏清單' })
  assert.equal(serviceCalled, false)
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

test('regions 與 map controller 應回傳 service 結果', async () => {
  const controller = createHospitalsController({
    findHospitalRegions: async () => [{ city: '台北市', districts: ['大安區'] }],
    findMapHospitals: async (query) => ({ hospitals: [], total: query.north, truncated: false }),
  })
  const regionsRes = createResponse()
  const mapRes = createResponse()
  await controller.listHospitalRegions({}, regionsRes)
  await controller.listMapHospitals({ validated_query: { north: 26 } }, mapRes)
  assert.deepEqual(regionsRes.body, { regions: [{ city: '台北市', districts: ['大安區'] }] })
  assert.deepEqual(mapRes.body, { hospitals: [], total: 26, truncated: false })
})
