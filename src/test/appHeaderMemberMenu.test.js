import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appHeader = readFileSync(
  new URL('../components/layout/AppHeader.vue', import.meta.url),
  'utf8',
)

test('會員下拉選單登出按鈕 hover 時會同步切換 icon 顏色', () => {
  assert.match(appHeader, /class="group flex w-full items-center[\s\S]*hover:text-brand-orange/)
  assert.match(appHeader, /import loginIcon from '@\/assets\/icons\/login\.svg'/)
  assert.match(appHeader, /class="auth-action-icon size-4 shrink-0 -scale-x-100"/)
  assert.match(appHeader, /\.group:hover \.auth-action-icon[\s\S]*filter:/)
  assert.doesNotMatch(appHeader, /transition: filter/)
})

test('會員下拉選單依序顯示會員首頁、個人資料與登出', () => {
  const memberHomeIndex = appHeader.indexOf('會員首頁')
  const profileIndex = appHeader.indexOf('個人資料', memberHomeIndex)
  const logoutIndex = appHeader.indexOf('登出', profileIndex)

  assert.ok(memberHomeIndex >= 0)
  assert.ok(profileIndex > memberHomeIndex)
  assert.ok(logoutIndex > profileIndex)
  assert.match(appHeader, /<RouterLink\s+to="\/dashboard"[\s\S]*?>[\s\S]*?會員首頁/)
  assert.match(appHeader, /個人資料[\s\S]*?<\/button>/)
  assert.match(appHeader, /@click="handleOpenUserProfileModal"/)
})

test('會員下拉選單上方會員資訊區僅供展示', () => {
  assert.match(appHeader, /<div class="flex w-full items-center gap-3 px-4 py-4">/)
  assert.doesNotMatch(appHeader, /aria-label="查看個人資料"/)
})

test('會員資訊展示區不提供 hover 或點擊互動', () => {
  assert.match(appHeader, /class="truncate text-lg font-semibold text-brand-navy"/)
  assert.match(appHeader, /class="truncate text-base font-medium text-brand-gray"/)
  assert.doesNotMatch(appHeader, /group-hover:border-brand-orange/)
})
