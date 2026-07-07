import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createAddRecord,
  createGetAllRecords,
  createGetPetRecords,
  createGetSingleRecord,
  createUpdateRecord,
  createDeleteRecord,
} from '../src/controllers/medical_records.controller.js'
import { MEDICAL_IMAGE_UPLOAD_INTENT_FIELD } from '../src/middlewares/upload_image.js'

function createMockResponse() {
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

test('列出目前使用者的所有醫療紀錄', async () => {
  const records = [{ id: 1, pet_id: 1, title: '例行體檢' }]
  const getAllRecords = createGetAllRecords({
    findAllRecordsByUserId: async (userId) => {
      assert.equal(userId, 1)
      return records
    },
  })

  const req = { userId: 1 }
  const res = createMockResponse()
  await getAllRecords(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { data: records })
})

test('列出指定寵物的醫療紀錄', async () => {
  const records = [{ id: 1, pet_id: 1, title: '例行體檢' }]
  const getPetRecords = createGetPetRecords({
    checkPetOwnership: async (petId, userId) => {
      assert.equal(petId, 1)
      assert.equal(userId, 1)
      return true
    },
    findRecordsByPetId: async (petId, userId) => {
      assert.equal(petId, 1)
      assert.equal(userId, 1)
      return records
    },
  })

  const req = { userId: 1, params: { petId: '1' } }
  const res = createMockResponse()
  await getPetRecords(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { data: records })
})

test('列出指定寵物醫療紀錄時，若寵物 ID 非有效數字應拒絕並回傳 400', async () => {
  const getPetRecords = createGetPetRecords({
    checkPetOwnership: async () => true,
    findRecordsByPetId: async () => [],
  })

  const req = { userId: 1, params: { petId: 'abc' } }
  const res = createMockResponse()
  await getPetRecords(req, res)

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { message: 'id 必須是正整數' })
})

test('當醫療紀錄不屬於目前使用者時應回傳 404', async () => {
  const getSingleRecord = createGetSingleRecord({
    findRecordById: async () => null,
  })

  const req = { userId: 1, params: { id: '99' } }
  const res = createMockResponse()
  await getSingleRecord(req, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到該筆醫療紀錄' })
})

test('應成功為目前登入會員擁建立寵物醫療紀錄', async () => {
  const createdRecord = { id: 10, pet_id: 1, title: '年度核心疫苗施打' }
  const addRecord = createAddRecord({
    checkPetOwnership: async (petId, userId) => {
      assert.equal(petId, 1)
      assert.equal(userId, 1)
      return true
    },
    createRecord: async (recordData) => {
      assert.equal(recordData.pet_id, 1)
      assert.equal(recordData.title, '年度核心疫苗施打')
      return createdRecord
    },
  })

  const req = {
    userId: 1,
    body: {
      pet_id: 1,
      record_type: '疫苗',
      title: '年度核心疫苗施打',
      record_date: '2026-06-24',
    },
  }
  const res = createMockResponse()
  await addRecord(req, res)

  assert.equal(res.statusCode, 201)
  assert.deepEqual(res.body, {
    message: '新增醫療紀錄成功',
    data: createdRecord,
  })
})

test('新增醫療紀錄時應將 Cloudinary image_url 陣列交給 service 寫入', async () => {
  const imageUrls = [
    'https://res.cloudinary.com/demo/first.png',
    'https://res.cloudinary.com/demo/second.png',
  ]
  const createdRecord = {
    id: 11,
    pet_id: 1,
    title: '檢查報告',
    image_url: imageUrls,
  }
  const addRecord = createAddRecord({
    checkPetOwnership: async (petId, userId) => {
      assert.equal(petId, 1)
      assert.equal(userId, 1)
      return true
    },
    createRecord: async (recordData) => {
      assert.deepEqual(recordData.image_url, imageUrls)
      return createdRecord
    },
  })

  const req = {
    userId: 1,
    body: {
      pet_id: 1,
      record_type: '體檢',
      title: '檢查報告',
      record_date: '2026-06-24',
      image_url: imageUrls,
    },
  }
  const res = createMockResponse()
  await addRecord(req, res)

  assert.equal(res.statusCode, 201)
  assert.deepEqual(res.body, {
    message: '新增醫療紀錄成功',
    data: createdRecord,
  })
})

test('新增醫療紀錄圖片時若寵物不屬於使用者，不應上傳 Cloudinary', async () => {
  let uploadCalled = false
  const addRecord = createAddRecord({
    checkPetOwnership: async (petId, userId) => {
      assert.equal(petId, 999)
      assert.equal(userId, 1)
      return false
    },
    uploadImages: async () => {
      uploadCalled = true
      return ['https://res.cloudinary.com/demo/report.png']
    },
    createRecord: async () => {
      throw new Error('createRecord should not be called')
    },
  })

  const req = {
    userId: 1,
    files: [{ buffer: Buffer.from('report') }],
    body: {
      pet_id: 999,
      record_type: '體檢',
      title: '檢查報告',
      record_date: '2026-06-24',
      [MEDICAL_IMAGE_UPLOAD_INTENT_FIELD]: true,
    },
  }
  const res = createMockResponse()

  await addRecord(req, res)

  assert.equal(uploadCalled, false)
  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到該寵物資訊' })
})

test('新增醫療紀錄圖片時應在確認寵物擁有權後才上傳並合併 image_url', async () => {
  let ownershipChecked = false
  const createdRecord = {
    id: 12,
    pet_id: 1,
    title: '檢查報告',
    image_url: [
      'https://example.com/existing.png',
      'https://res.cloudinary.com/demo/report.png',
    ],
  }
  const addRecord = createAddRecord({
    checkPetOwnership: async (petId, userId) => {
      assert.equal(petId, 1)
      assert.equal(userId, 1)
      ownershipChecked = true
      return true
    },
    uploadImages: async (files) => {
      assert.equal(ownershipChecked, true)
      assert.equal(files.length, 1)
      return ['https://res.cloudinary.com/demo/report.png']
    },
    createRecord: async (recordData) => {
      assert.equal(ownershipChecked, true)
      assert.deepEqual(recordData.image_url, [
        'https://example.com/existing.png',
        'https://res.cloudinary.com/demo/report.png',
      ])
      return createdRecord
    },
  })

  const req = {
    userId: 1,
    files: [{ buffer: Buffer.from('report') }],
    body: {
      pet_id: 1,
      record_type: '體檢',
      title: '檢查報告',
      record_date: '2026-06-24',
      image_url: ['https://example.com/existing.png'],
      [MEDICAL_IMAGE_UPLOAD_INTENT_FIELD]: true,
    },
  }
  const res = createMockResponse()

  await addRecord(req, res)

  assert.equal(res.statusCode, 201)
  assert.deepEqual(res.body, {
    message: '新增醫療紀錄成功',
    data: createdRecord,
  })
})

test('當新增紀錄時，若系統發生未知錯誤應該要回傳 500 錯誤訊息', async (t) => {
  t.mock.method(console, 'error', () => {})
  const addRecord = createAddRecord({
    checkPetOwnership: async () => {
      throw new Error('Database disconnected')
    },
    createRecord: async () => {},
  })

  const req = {
    userId: 1,
    body: { title: '年度核心疫苗施打' },
  }
  const res = createMockResponse()
  await addRecord(req, res)

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { message: '新增醫療紀錄失敗，請稍後再試' })
})

test('當新增醫療紀錄時，若寵物不屬於該使用者應回傳 404', async () => {
  const addRecord = createAddRecord({
    checkPetOwnership: async () => false,
    createRecord: async () => {},
  })

  const req = {
    userId: 1,
    body: {
      pet_id: 999,
      record_type: '看診',
      title: '看診紀錄',
      record_date: '2026-06-24',
    },
  }
  const res = createMockResponse()
  await addRecord(req, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到該寵物資訊' })
})

test('應成功修改目前使用者寵物的醫療紀錄', async () => {
  const updatedRecord = { id: 10, pet_id: 1, title: '新標題' }
  const updateRecord = createUpdateRecord({
    findRecordById: async (id, userId) => {
      assert.equal(id, 10)
      assert.equal(userId, 1)
      return { id: 10, pet_id: 1 }
    },
    checkPetOwnership: async () => true,
    updateRecord: async (id, updateData) => {
      assert.equal(id, 10)
      assert.deepEqual(updateData, { title: '新標題' })
      return updatedRecord
    },
  })

  const req = {
    userId: 1,
    params: { id: '10' },
    body: { title: '新標題' },
  }
  const res = createMockResponse()
  await updateRecord(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, {
    message: '更新醫療紀錄成功',
    data: updatedRecord,
  })
})

test('更新醫療紀錄時應將 Cloudinary image_url 陣列交給 service 寫入', async () => {
  const imageUrls = ['https://res.cloudinary.com/demo/updated.png']
  const updatedRecord = { id: 10, pet_id: 1, title: '新標題', image_url: imageUrls }
  const updateRecord = createUpdateRecord({
    findRecordById: async () => ({ id: 10, pet_id: 1 }),
    checkPetOwnership: async () => true,
    updateRecord: async (id, updateData) => {
      assert.equal(id, 10)
      assert.deepEqual(updateData, { image_url: imageUrls })
      return updatedRecord
    },
  })

  const req = {
    userId: 1,
    params: { id: '10' },
    body: { image_url: imageUrls },
  }
  const res = createMockResponse()
  await updateRecord(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, {
    message: '更新醫療紀錄成功',
    data: updatedRecord,
  })
})

test('更新醫療紀錄圖片時若找不到紀錄，不應上傳 Cloudinary', async () => {
  let uploadCalled = false
  const updateRecord = createUpdateRecord({
    findRecordById: async (id, userId) => {
      assert.equal(id, 10)
      assert.equal(userId, 1)
      return null
    },
    checkPetOwnership: async () => true,
    uploadImages: async () => {
      uploadCalled = true
      return ['https://res.cloudinary.com/demo/report.png']
    },
    updateRecord: async () => {
      throw new Error('updateRecord should not be called')
    },
  })

  const req = {
    userId: 1,
    params: { id: '10' },
    files: [{ buffer: Buffer.from('report') }],
    body: {
      [MEDICAL_IMAGE_UPLOAD_INTENT_FIELD]: true,
    },
  }
  const res = createMockResponse()

  await updateRecord(req, res)

  assert.equal(uploadCalled, false)
  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: '找不到該筆醫療紀錄' })
})

test('更新醫療紀錄移轉至非本人寵物時，不應上傳 Cloudinary', async () => {
  let uploadCalled = false
  const updateRecord = createUpdateRecord({
    findRecordById: async () => ({ id: 10, pet_id: 1 }),
    checkPetOwnership: async (petId, userId) => {
      assert.equal(petId, 999)
      assert.equal(userId, 1)
      return false
    },
    uploadImages: async () => {
      uploadCalled = true
      return ['https://res.cloudinary.com/demo/report.png']
    },
    updateRecord: async () => {
      throw new Error('updateRecord should not be called')
    },
  })

  const req = {
    userId: 1,
    params: { id: '10' },
    files: [{ buffer: Buffer.from('report') }],
    body: {
      pet_id: 999,
      [MEDICAL_IMAGE_UPLOAD_INTENT_FIELD]: true,
    },
  }
  const res = createMockResponse()

  await updateRecord(req, res)

  assert.equal(uploadCalled, false)
  assert.equal(res.statusCode, 403)
  assert.deepEqual(res.body, { message: '無權限將紀錄移轉至該寵物' })
})

test('更新醫療紀錄圖片時應在確認紀錄權限後才上傳並合併 image_url', async () => {
  let recordChecked = false
  const updatedRecord = {
    id: 10,
    pet_id: 1,
    image_url: [
      'https://example.com/existing.png',
      'https://res.cloudinary.com/demo/report.png',
    ],
  }
  const updateRecord = createUpdateRecord({
    findRecordById: async (id, userId) => {
      assert.equal(id, 10)
      assert.equal(userId, 1)
      recordChecked = true
      return { id: 10, pet_id: 1 }
    },
    checkPetOwnership: async () => true,
    uploadImages: async (files) => {
      assert.equal(recordChecked, true)
      assert.equal(files.length, 1)
      return ['https://res.cloudinary.com/demo/report.png']
    },
    updateRecord: async (id, updateData) => {
      assert.equal(id, 10)
      assert.deepEqual(updateData, {
        image_url: [
          'https://example.com/existing.png',
          'https://res.cloudinary.com/demo/report.png',
        ],
      })
      return updatedRecord
    },
  })

  const req = {
    userId: 1,
    params: { id: '10' },
    files: [{ buffer: Buffer.from('report') }],
    body: {
      image_url: ['https://example.com/existing.png'],
      [MEDICAL_IMAGE_UPLOAD_INTENT_FIELD]: true,
    },
  }
  const res = createMockResponse()

  await updateRecord(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, {
    message: '更新醫療紀錄成功',
    data: updatedRecord,
  })
})

test('修改醫療紀錄時，若企圖將紀錄移轉至不屬於自己的寵物應回傳 403 拒絕', async () => {
  const updateRecord = createUpdateRecord({
    findRecordById: async () => {
      return { id: 10, pet_id: 1 }
    },
    checkPetOwnership: async (petId, userId) => {
      assert.equal(petId, 999)
      assert.equal(userId, 1)
      return false
    },
    updateRecord: async () => {},
  })

  const req = {
    userId: 1,
    params: { id: '10' },
    body: { pet_id: 999 },
  }
  const res = createMockResponse()
  await updateRecord(req, res)

  assert.equal(res.statusCode, 403)
  assert.deepEqual(res.body, { message: '無權限將紀錄移轉至該寵物' })
})

test('應成功刪除目前使用者寵物的醫療紀錄', async () => {
  const deleteRecord = createDeleteRecord({
    findRecordById: async (id, userId) => {
      assert.equal(id, 10)
      assert.equal(userId, 1)
      return { id: 10, pet_id: 1 }
    },
    deleteRecord: async (id) => {
      assert.equal(id, 10)
      return true
    },
  })

  const req = { userId: 1, params: { id: '10' } }
  const res = createMockResponse()
  await deleteRecord(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { message: '刪除醫療紀錄成功' })
})
