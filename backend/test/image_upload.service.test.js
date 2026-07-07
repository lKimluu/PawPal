import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createImageUploadService } from '../src/services/image_upload.service.js'

function createFile(buffer = Buffer.from('image')) {
  return {
    buffer,
    originalname: 'photo.png',
    mimetype: 'image/png',
  }
}

test('uploadImage 應回傳 Cloudinary secure_url', async () => {
  const seen = []
  const service = createImageUploadService({
    folder: 'pawpal-test',
    uploader: {
      upload_stream: (options, callback) => {
        seen.push(options)
        return {
          end: () => callback(null, { secure_url: 'https://res.cloudinary.com/demo/photo.png' }),
        }
      },
    },
  })

  const url = await service.uploadImage(createFile())

  assert.equal(url, 'https://res.cloudinary.com/demo/photo.png')
  assert.deepEqual(seen, [{ folder: 'pawpal-test', resource_type: 'image' }])
})

test('uploadImages 應依序回傳多張圖片 secure_url', async () => {
  const urls = [
    'https://res.cloudinary.com/demo/first.png',
    'https://res.cloudinary.com/demo/second.png',
  ]
  const service = createImageUploadService({
    uploader: {
      upload_stream: (options, callback) => {
        return {
          end: () => callback(null, { secure_url: urls.shift() }),
        }
      },
    },
  })

  const uploadedUrls = await service.uploadImages([createFile(), createFile()])

  assert.deepEqual(uploadedUrls, [
    'https://res.cloudinary.com/demo/first.png',
    'https://res.cloudinary.com/demo/second.png',
  ])
})

test('uploadImage 在 Cloudinary 拋錯時應丟出繁中錯誤並帶 status', async () => {
  const service = createImageUploadService({
    uploader: {
      upload_stream: (options, callback) => {
        return {
          end: () => callback(new Error('network failed')),
        }
      },
    },
  })

  await assert.rejects(() => service.uploadImage(createFile()), {
    message: '圖片上傳失敗，請稍後再試',
    status: 502,
  })
})

test('uploadImage 在 Cloudinary upload_stream 同步拋錯時應丟出繁中錯誤並帶 status', async () => {
  const service = createImageUploadService({
    uploader: {
      upload_stream: () => {
        throw new Error('invalid config')
      },
    },
  })

  await assert.rejects(() => service.uploadImage(createFile()), {
    message: '圖片上傳失敗，請稍後再試',
    status: 502,
  })
})

test('uploadImage 在 Cloudinary 未回傳 secure_url 時應丟出繁中錯誤並帶 status', async () => {
  const service = createImageUploadService({
    uploader: {
      upload_stream: (options, callback) => {
        return {
          end: () => callback(null, { url: 'http://example.com/not-secure.png' }),
        }
      },
    },
  })

  await assert.rejects(() => service.uploadImage(createFile()), {
    message: '圖片上傳失敗，請稍後再試',
    status: 502,
  })
})
