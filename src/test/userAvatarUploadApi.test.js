import assert from 'node:assert/strict'
import { test } from 'node:test'

import { updateUserProfileRequestConfig } from '../api/user.js'

test('會員資料更新有頭像檔案時應建立 avatar multipart payload', async () => {
  const avatarFile = new Blob(['avatar'], { type: 'image/png' })
  const request = updateUserProfileRequestConfig(
    {
      name: ' Alice Lin ',
      avatarFile,
    },
    'token-123',
  )

  assert.ok(request.data instanceof FormData)
  assert.equal(request.headers.Authorization, 'Bearer token-123')
  assert.equal(Object.hasOwn(request.headers, 'Content-Type'), false)
  assert.equal(request.data.get('name'), 'Alice Lin')
  assert.equal(await request.data.get('avatar').text(), 'avatar')
})
