import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const userProfileModalUrl = new URL('../components/member/UserProfileModal.vue', import.meta.url)
const baseModal = readFileSync(
  new URL('../components/common/BaseModal.vue', import.meta.url),
  'utf8',
)
const appHeader = readFileSync(
  new URL('../components/layout/AppHeader.vue', import.meta.url),
  'utf8',
)
const defaultUserIcon = readFileSync(
  new URL('../assets/icons/user.svg', import.meta.url),
  'utf8',
)

test('BaseModal 提供內容插槽給外部 modal 引入使用', () => {
  assert.match(baseModal, /<slot>/)
  assert.match(baseModal, /<\/slot>/)
})

test('UserProfileModal 使用 BaseModal 引入方式呈現會員資料內容', () => {
  assert.equal(existsSync(userProfileModalUrl), true)

  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /import BaseModal from '@\/components\/common\/BaseModal\.vue'/)
  assert.match(source, /import defaultProfileIcon from '@\/assets\/icons\/user\.svg'/)
  assert.match(source, /<BaseModal[\s\S]*:is-open="isOpen"[\s\S]*@close="\$emit\('close'\)"/)
  assert.match(source, /grid-cols-1[\s\S]*md:grid-cols-\[auto_1fr\]/)
  assert.match(source, /memberAvatarUrl/)
  assert.match(source, /memberDisplayName/)
  assert.match(source, /memberDisplayEmail/)
})

test('AppHeader 點擊會員資訊區會開啟 UserProfileModal', () => {
  assert.match(appHeader, /import UserProfileModal from '@\/components\/member\/UserProfileModal\.vue'/)
  assert.match(appHeader, /import defaultProfileIcon from '@\/assets\/icons\/user\.svg'/)
  assert.match(appHeader, /const isUserProfileModalOpen = ref\(false\)/)
  assert.match(appHeader, /function handleOpenUserProfileModal\(\)[\s\S]*isUserProfileModalOpen\.value = true/)
  assert.match(appHeader, /aria-label="查看個人資料"[\s\S]*@click="handleOpenUserProfileModal"/)
  assert.match(appHeader, /<UserProfileModal[\s\S]*:is-open="isUserProfileModalOpen"[\s\S]*:user="authStore\.user"[\s\S]*@close="isUserProfileModalOpen = false"/)
})

test('預設會員頭像 SVG 線條顏色與會員名稱文字一致', () => {
  assert.match(defaultUserIcon, /stroke="#606060"/)
  assert.doesNotMatch(defaultUserIcon, /stroke="currentColor"/)
})
