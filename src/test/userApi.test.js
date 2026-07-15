import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { buildUpdateUserProfilePayload, updateUserProfileRequestConfig } from '../api/user.js'

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

test('buildUpdateUserProfilePayload 只轉換可編輯的會員個人資料欄位', () => {
  const payload = buildUpdateUserProfilePayload({
    name: ' Alice Lin ',
    avatarUrl: ' https://example.com/alice.png ',
    email: 'ignored@example.com',
  })

  assert.deepEqual(payload, {
    name: 'Alice Lin',
    avatar_url: 'https://example.com/alice.png',
  })
})

test('updateUserProfileRequestConfig 帶入登入 token 與 JSON content type', () => {
  const request = updateUserProfileRequestConfig(
    {
      name: 'Alice Lin',
      avatar_url: 'https://example.com/alice.png',
    },
    'token-123',
  )

  assert.deepEqual(request, {
    data: {
      name: 'Alice Lin',
      avatar_url: 'https://example.com/alice.png',
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-123',
    },
  })
})

test('auth store 提供 updateProfile 並保存後端回傳的會員資料', () => {
  const authStore = readSource('../stores/auth.js')

  assert.match(authStore, /updateUserProfileApi/)
  assert.match(authStore, /async function updateProfile/)
  assert.match(authStore, /user\.value = result\.data\.user \|\| user\.value/)
  assert.match(authStore, /persistAuthState\(\)/)
  assert.match(authStore, /updateProfile/)
})
