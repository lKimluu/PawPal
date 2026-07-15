import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createUpdateCurrentUser } from '../src/controllers/users.controller.js'

function createResponse(statusCode = null) {
  return {
    statusCode,
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

test('修改目前會員頭像時應將 Cloudinary avatar_url 交給 service 寫入', async () => {
  const updatedUser = {
    id: 1,
    email: 'alice@example.com',
    name: 'Alice Lin',
    avatar_url: 'https://res.cloudinary.com/demo/member.png',
    created_at: new Date('2026-06-18T00:00:00Z'),
  }
  let uploadCalled = false
  const updateCurrentUser = createUpdateCurrentUser({
    findUserById: async (id) => {
      assert.equal(id, 1)
      return { id: 1 }
    },
    updateCurrentUser: async (id, payload) => {
      assert.equal(id, 1)
      assert.equal(uploadCalled, true)
      assert.deepEqual(payload, {
        name: 'Alice Lin',
        avatar_url: 'https://res.cloudinary.com/demo/member.png',
      })
      return updatedUser
    },
    uploadImages: async (files) => {
      uploadCalled = true
      assert.deepEqual(files, [{ buffer: Buffer.from('avatar') }])
      return ['https://res.cloudinary.com/demo/member.png']
    },
  })
  const req = {
    userId: 1,
    files: [{ buffer: Buffer.from('avatar') }],
    body: {
      name: 'Alice Lin',
      __avatar_upload: true,
    },
  }
  const res = createResponse()

  await updateCurrentUser(req, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { user: updatedUser })
})

test('修改目前會員頭像時若會員不存在不應上傳圖片', async () => {
  let uploadCalled = false
  const updateCurrentUser = createUpdateCurrentUser({
    findUserById: async () => null,
    updateCurrentUser: async () => {
      throw new Error('updateCurrentUser should not be called')
    },
    uploadImages: async () => {
      uploadCalled = true
    },
  })
  const req = {
    userId: 999,
    files: [{ buffer: Buffer.from('avatar') }],
    body: {
      __avatar_upload: true,
    },
  }
  const res = createResponse(200)

  await updateCurrentUser(req, res)

  assert.equal(uploadCalled, false)
  assert.equal(res.statusCode, 404)
  assert.equal(typeof res.body?.message, 'string')
})
