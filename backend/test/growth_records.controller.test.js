import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createGrowthRecordsController } from '../src/controllers/growth_records.controller.js'

test('應匯出可注入相依服務的成長紀錄 controller factory', () => {
  assert.equal(typeof createGrowthRecordsController, 'function')
})

function createTestController(overrides = {}) {
  const notImplemented = async () => {
    throw new Error('service method should not be called')
  }
  return createGrowthRecordsController({
    findGrowthRecords: notImplemented,
    createGrowthRecord: notImplemented,
    updateGrowthRecord: notImplemented,
    deleteGrowthRecord: notImplemented,
    ...overrides,
  })
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    sent: false,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    send(payload) {
      this.body = payload
      this.sent = true
      return this
    },
  }
}

test('取得指定寵物的成長紀錄', async () => {
  const records = [{ id: 1, pet_id: 1, metric_type: 'weight', value: '8.20', unit: 'kg' }]
  const { getGrowthRecords } = createTestController({
    findGrowthRecords: async (userId, petId, metricType) => {
      assert.equal(petId, 1)
      return records
    },
  })
  const req = { userId: 1, query: { pet_id: '1' } }
  const res = createResponse()

  await getGrowthRecords(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { records })
})

test('petId 無效時回傳 400', async () => {
  const { getGrowthRecords } = createTestController()
  const req = { userId: 1, query: { petId: 'abc' } }
  const res = createResponse()

  await getGrowthRecords(req, res)

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '寵物 ID 不正確，請確認後再試' })
})

test('metricType 無效時回傳 400', async () => {
  const { getGrowthRecords } = createTestController()
  const req = { userId: 1, query: { pet_id: '1', metric_type: 'invalid_type' } }
  const res = createResponse()

  await getGrowthRecords(req, res)

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '查無此測量類型，請確認後再試' })
})

test('新增成長紀錄成功回傳 201', async () => {
  const record = { id: 1, pet_id: 1, metric_type: 'weight', value: '8.20', unit: 'kg' }
  const { createGrowthRecord } = createTestController({
    createGrowthRecord: async (data) => {
      assert.equal(data.petId, 1)
      assert.equal(data.metricType, 'weight')
      return record
    },
  })
  const req = {
    userId: 1,
    body: {
      pet_id: 1,
      metric_type: 'weight',
      value: 8.2,
      unit: 'kg',
      recorded_at: '2026-06-25 10:00:00',
    },
  }
  const res = createResponse()

  await createGrowthRecord(req, res)

  assert.equal(res.statusCode, 201)
  assert.deepEqual(res.body, { record })
})

test('新增時寵物不存在或無權限回傳 403', async () => {
  const { createGrowthRecord } = createTestController({
    createGrowthRecord: async () => null,
  })
  const req = {
    userId: 1,
    body: {
      pet_id: 99,
      metric_type: 'weight',
      value: 8.2,
      unit: 'kg',
      recorded_at: '2026-06-25 10:00:00',
    },
  }
  const res = createResponse()

  await createGrowthRecord(req, res)

  assert.equal(res.statusCode, 403)
  assert.deepEqual(res.body, { message: '找不到此寵物，或沒有新增紀錄的權限' })
})

test('更新成長紀錄成功', async () => {
  const record = { id: 1, pet_id: 1, metric_type: 'weight', value: '9.00', unit: 'kg' }
  const { updateGrowthRecord } = createTestController({
    updateGrowthRecord: async (userId, id, data) => {
      assert.equal(id, 1)
      return record
    },
  })
  const req = {
    userId: 1,
    params: { id: '1' },
    body: { value: 9.0, unit: 'kg', recorded_at: '2026-06-25 10:00:00' },
  }
  const res = createResponse()

  await updateGrowthRecord(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { record })
})

test('更新找不到紀錄回傳 404', async () => {
  const { updateGrowthRecord } = createTestController({
    updateGrowthRecord: async () => null,
  })
  const req = {
    userId: 1,
    params: { id: '999' },
    body: { value: 9.0, unit: 'kg', recorded_at: '2026-06-25 10:00:00' },
  }
  const res = createResponse()

  await updateGrowthRecord(req, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到這筆成長紀錄' })
})

test('更新時紀錄 ID 無效回傳 400', async () => {
  const { updateGrowthRecord } = createTestController()
  const req = {
    userId: 1,
    params: { id: 'abc' },
    body: { value: 9.0, unit: 'kg', recorded_at: '2026-06-25 10:00:00' },
  }
  const res = createResponse()

  await updateGrowthRecord(req, res)

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '紀錄 ID 不正確，請確認後再試' })
})

test('刪除成長紀錄成功回傳 204', async () => {
  const { deleteGrowthRecord } = createTestController({
    deleteGrowthRecord: async (userId, id) => {
      assert.equal(id, 1)
      return { id: 1 }
    },
  })
  const req = { userId: 1, params: { id: '1' } }
  const res = createResponse()

  await deleteGrowthRecord(req, res)

  assert.equal(res.statusCode, 204)
  assert.equal(res.sent, true)
})

test('刪除找不到紀錄回傳 404', async () => {
  const { deleteGrowthRecord } = createTestController({
    deleteGrowthRecord: async () => null,
  })
  const req = { userId: 1, params: { id: '999' } }
  const res = createResponse()

  await deleteGrowthRecord(req, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到這筆成長紀錄' })
})

test('刪除時紀錄 ID 無效回傳 400', async () => {
  const { deleteGrowthRecord } = createTestController()
  const req = { userId: 1, params: { id: 'abc' } }
  const res = createResponse()

  await deleteGrowthRecord(req, res)

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: '紀錄 ID 不正確，請確認後再試' })
})
