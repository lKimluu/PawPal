import assert from 'node:assert/strict'
import { test } from 'node:test'
import multer from 'multer'

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MEDICAL_IMAGE_UPLOAD_INTENT_FIELD,
  MAX_IMAGE_FILE_SIZE_BYTES,
  PET_AVATAR_UPLOAD_INTENT_FIELD,
  formatUploadError,
  imageFileFilter,
  normalizeMedicalRecordMultipartBody,
  normalizePetMultipartBody,
} from '../src/middlewares/upload_image.js'

function runFileFilter(file) {
  return new Promise((resolve) => {
    imageFileFilter({}, file, (error, accepted) => {
      resolve({ error, accepted })
    })
  })
}

test('imageFileFilter 應接受 jpeg、png、webp 圖片', async () => {
  for (const mimetype of ALLOWED_IMAGE_MIME_TYPES) {
    const result = await runFileFilter({ mimetype })

    assert.equal(result.error, null)
    assert.equal(result.accepted, true)
  }
})

test('imageFileFilter 應拒絕非圖片 MIME type 並回傳 400 錯誤', async () => {
  const result = await runFileFilter({ mimetype: 'application/pdf' })

  assert.equal(result.accepted, undefined)
  assert.equal(result.error.status, 400)
  assert.equal(result.error.message, '僅支援 JPG、PNG 或 WebP 圖片')
})

test('formatUploadError 應將 multer 檔案過大錯誤轉為 400', () => {
  const error = formatUploadError(new multer.MulterError('LIMIT_FILE_SIZE'))

  assert.equal(MAX_IMAGE_FILE_SIZE_BYTES, 5 * 1024 * 1024)
  assert.equal(error.status, 400)
  assert.equal(error.message, '圖片檔案大小不可超過 5MB')
})

test('formatUploadError 應將 multer 非預期欄位或超過數量錯誤轉為 400', () => {
  const error = formatUploadError(new multer.MulterError('LIMIT_UNEXPECTED_FILE'))

  assert.equal(error.status, 400)
  assert.equal(error.message, '圖片欄位或數量不符合限制')
})

test('normalizePetMultipartBody 應將 multipart 寵物欄位轉成 schema 可接受型別', () => {
  const req = {
    headers: { 'content-type': 'multipart/form-data; boundary=test' },
    body: {
      name: 'Oreo',
      species: 'Dog',
      weight: '12.5',
      neutered: 'false',
    },
  }

  normalizePetMultipartBody(req, {}, () => {})

  assert.equal(req.body.weight, 12.5)
  assert.equal(req.body.neutered, false)
})

test('normalizePetMultipartBody 應在 multipart 含檔案時標記 avatar upload intent', () => {
  const req = {
    headers: { 'content-type': 'multipart/form-data; boundary=test' },
    files: [{ buffer: Buffer.from('image') }],
    body: {
      name: 'Oreo',
      species: 'Dog',
    },
  }

  normalizePetMultipartBody(req, {}, () => {})

  assert.equal(req.body[PET_AVATAR_UPLOAD_INTENT_FIELD], true)
})

test('normalizeMedicalRecordMultipartBody 應將 multipart 醫療紀錄欄位轉成 schema 可接受型別', () => {
  const req = {
    headers: { 'content-type': 'multipart/form-data; boundary=test' },
    body: {
      pet_id: '3',
      image_url: 'https://example.com/existing.png',
    },
  }

  normalizeMedicalRecordMultipartBody(req, {}, () => {})

  assert.equal(req.body.pet_id, 3)
  assert.deepEqual(req.body.image_url, ['https://example.com/existing.png'])
})

test('normalizeMedicalRecordMultipartBody 應在 multipart 含檔案時標記 image upload intent', () => {
  const req = {
    headers: { 'content-type': 'multipart/form-data; boundary=test' },
    files: [{ buffer: Buffer.from('image') }],
    body: {
      pet_id: '3',
    },
  }

  normalizeMedicalRecordMultipartBody(req, {}, () => {})

  assert.equal(req.body.pet_id, 3)
  assert.equal(req.body[MEDICAL_IMAGE_UPLOAD_INTENT_FIELD], true)
})

test('normalizePetMultipartBody 不應改變 JSON request 欄位型別', () => {
  const req = {
    headers: { 'content-type': 'application/json' },
    body: {
      weight: '12.5',
      neutered: 'false',
    },
  }

  normalizePetMultipartBody(req, {}, () => {})

  assert.equal(req.body.weight, '12.5')
  assert.equal(req.body.neutered, 'false')
})
