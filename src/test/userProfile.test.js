import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  getUserAvatarUrl,
  getUserDisplayEmail,
  getUserDisplayName,
  hasUserAvatar,
} from '../utils/userProfile.js'

test('hasUserAvatar 只將非空白 avatar_url 視為已上傳頭像', () => {
  assert.equal(hasUserAvatar({ avatar_url: 'https://example.com/avatar.png' }), true)
  assert.equal(hasUserAvatar({ avatar_url: '   https://example.com/avatar.png   ' }), true)
  assert.equal(hasUserAvatar({ avatar_url: '' }), false)
  assert.equal(hasUserAvatar({ avatar_url: '   ' }), false)
  assert.equal(hasUserAvatar({ avatar_url: null }), false)
  assert.equal(hasUserAvatar(null), false)
})

test('getUserAvatarUrl 回傳去除空白的 avatar_url 或空字串', () => {
  assert.equal(getUserAvatarUrl({ avatar_url: '  https://example.com/avatar.png  ' }), 'https://example.com/avatar.png')
  assert.equal(getUserAvatarUrl({ avatar_url: '' }), '')
  assert.equal(getUserAvatarUrl({ avatar_url: null }), '')
})

test('getUserDisplayName 與 getUserDisplayEmail 會使用可讀的預設文字', () => {
  assert.equal(getUserDisplayName({ name: '測試會員' }), '測試會員')
  assert.equal(getUserDisplayName({ name: '   ' }), '寵物家長')
  assert.equal(getUserDisplayName(null), '寵物家長')
  assert.equal(getUserDisplayEmail({ email: '  member@example.com  ' }), 'member@example.com')
  assert.equal(getUserDisplayEmail({ email: '' }), '尚未提供 Email')
})
