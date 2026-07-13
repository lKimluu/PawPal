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
  assert.match(appHeader, /class="logout-icon size-4/)
  assert.match(appHeader, /--icon-url[\s\S]*loginIcon/)
  assert.match(appHeader, /background-color: currentColor/)
  assert.doesNotMatch(appHeader, /<line x1="15" y1="12" x2="3" y2="12"/)
})

test('會員下拉選單上方會員資訊區先使用按鈕語意', () => {
  assert.match(appHeader, /aria-label="查看個人資料"/)
  assert.match(appHeader, /type="button"[\s\S]*class="group flex w-full items-center gap-3 px-4 py-4 text-left/)
})

test('會員資訊按鈕 hover 時會強調頭像外框與會員名稱', () => {
  assert.match(appHeader, /class="group flex w-full items-center gap-3 px-4 py-4/)
  assert.match(appHeader, /group-hover:border-brand-orange/)
  assert.match(appHeader, /group-hover:text-brand-orange/)
  assert.match(appHeader, /text-lg font-semibold text-brand-navy transition group-hover:text-brand-orange/)
  assert.match(appHeader, /text-base font-medium text-brand-gray transition group-hover:text-brand-orange/)
})
