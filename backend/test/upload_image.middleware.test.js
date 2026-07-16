import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import multer from 'multer'

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MEDICAL_IMAGE_UPLOAD_INTENT_FIELD,
  MAX_AVATAR_IMAGE_FILE_SIZE_BYTES,
  MAX_MEDICAL_IMAGE_FILE_SIZE_BYTES,
  PET_AVATAR_UPLOAD_INTENT_FIELD,
  formatUploadError,
  imageFileFilter,
  normalizeMedicalRecordMultipartBody,
  normalizePetMultipartBody,
} from '../src/middlewares/upload_image.js'

const uploadImageMiddlewareSource = readFileSync(
  new URL('../src/middlewares/upload_image.js', import.meta.url),
  'utf8',
)

function runFileFilter(file) {
  return new Promise((resolve) => {
    imageFileFilter({}, file, (error, accepted) => {
      resolve({ error, accepted })
    })
  })
}

test('圖片檔案篩選器 imageFileFilter 應接受 jpeg、png、webp、heic、heif 圖片', async () => {
  assert.deepEqual([...ALLOWED_IMAGE_MIME_TYPES].sort(), [
    'image/heic',
    'image/heif',
    'image/jpeg',
    'image/png',
    'image/webp',
  ])

  for (const mimetype of ALLOWED_IMAGE_MIME_TYPES) {
    const result = await runFileFilter({ mimetype })

    assert.equal(result.error, null)
    assert.equal(result.accepted, true)
  }
})

test('圖片檔案篩選器 imageFileFilter 應拒絕非圖片 MIME type 並回傳 400 錯誤', async () => {
  const result = await runFileFilter({ mimetype: 'application/pdf' })

  assert.equal(result.accepted, undefined)
  assert.equal(result.error.status, 400)
  assert.equal(result.error.message, '僅支援 JPG、PNG、WebP、HEIC 或 HEIF 圖片')
})

test('上傳錯誤格式化 formatUploadError 應將 multer 檔案過大錯誤轉為 400', () => {
  const error = formatUploadError(
    new multer.MulterError('LIMIT_FILE_SIZE'),
    MAX_AVATAR_IMAGE_FILE_SIZE_BYTES,
  )

  assert.equal(MAX_AVATAR_IMAGE_FILE_SIZE_BYTES, 10 * 1024 * 1024)
  assert.equal(error.status, 400)
  assert.equal(error.message, '圖片檔案大小不可超過 10MB')
})

test('醫療紀錄圖片上傳錯誤應提示 15MB 大小限制', () => {
  const error = formatUploadError(
    new multer.MulterError('LIMIT_FILE_SIZE'),
    MAX_MEDICAL_IMAGE_FILE_SIZE_BYTES,
  )

  assert.equal(MAX_MEDICAL_IMAGE_FILE_SIZE_BYTES, 15 * 1024 * 1024)
  assert.equal(error.status, 400)
  assert.equal(error.message, '圖片檔案大小不可超過 15MB')
})

test('圖片上傳 middleware 應依用途套用不同檔案大小限制', () => {
  assert.match(
    uploadImageMiddlewareSource,
    /uploadPetAvatar = createImageUploadMiddleware\(\s*'avatar',\s*1,\s*MAX_AVATAR_IMAGE_FILE_SIZE_BYTES,\s*\)/,
  )
  assert.match(
    uploadImageMiddlewareSource,
    /uploadUserAvatar = createImageUploadMiddleware\(\s*'avatar',\s*1,\s*MAX_AVATAR_IMAGE_FILE_SIZE_BYTES,\s*\)/,
  )
  assert.match(
    uploadImageMiddlewareSource,
    /uploadMedicalRecordImages = createImageUploadMiddleware\(\s*'images',\s*5,\s*MAX_MEDICAL_IMAGE_FILE_SIZE_BYTES,\s*\)/,
  )
})

test('上傳錯誤格式化 formatUploadError 應將 multer 非預期欄位或超過數量錯誤轉為 400', () => {
  const error = formatUploadError(new multer.MulterError('LIMIT_UNEXPECTED_FILE'))

  assert.equal(error.status, 400)
  assert.equal(error.message, '圖片欄位或數量不符合限制')
})

test('寵物 multipart 正規化 normalizePetMultipartBody 應將欄位轉成 schema 可接受型別', () => {
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

test('寵物 multipart 正規化 normalizePetMultipartBody 應在含檔案時標記 avatar upload intent', () => {
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

test('醫療紀錄 multipart 正規化 normalizeMedicalRecordMultipartBody 應將欄位轉成 schema 可接受型別', () => {
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

test('醫療紀錄 multipart 正規化 normalizeMedicalRecordMultipartBody 應在含檔案時標記 image upload intent', () => {
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

test('寵物 multipart 正規化 normalizePetMultipartBody 不應改變 JSON request 欄位型別', () => {
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
