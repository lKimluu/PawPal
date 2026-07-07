import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

import { createRecordRequestData } from '../api/medical.js'

function readSource(path) {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

test('createRecordRequestData 有 rawFiles 時會建立 multipart FormData', async () => {
  const imageFile = new Blob(['medical-image'], { type: 'image/png' })
  const request = createRecordRequestData({
    pet_id: 3,
    record_type: '看診',
    title: '皮膚檢查',
    record_date: '2026-07-07',
    image_url: ['https://example.com/existing.png', 'blob:http://localhost/preview'],
    rawFiles: [imageFile],
  })

  assert.ok(request.data instanceof FormData)
  assert.equal(request.headers['Content-Type'], undefined)
  assert.equal(request.data.get('pet_id'), '3')
  assert.equal(request.data.get('record_type'), '看診')
  assert.equal(request.data.get('title'), '皮膚檢查')
  assert.deepEqual(request.data.getAll('image_url'), ['https://example.com/existing.png'])
  assert.equal(await request.data.get('images').text(), 'medical-image')
})

test('createRecordRequestData 沒有 rawFiles 時維持 JSON payload', () => {
  const request = createRecordRequestData({
    pet_id: 3,
    record_type: '看診',
    title: '皮膚檢查',
    record_date: '2026-07-07',
    image_url: ['https://example.com/existing.png'],
    rawFiles: [],
  })

  assert.equal(request.headers['Content-Type'], 'application/json')
  assert.deepEqual(request.data, {
    pet_id: 3,
    record_type: '看診',
    title: '皮膚檢查',
    record_date: '2026-07-07',
    image_url: ['https://example.com/existing.png'],
  })
})

test('MedicalRecordModal 不應再直接 import Supabase client', () => {
  const modal = readSource('../components/medical/MedicalRecordModal.vue')

  assert.doesNotMatch(modal, /supabase/)
  assert.doesNotMatch(modal, /uploadImagesToSupabase/)
})
