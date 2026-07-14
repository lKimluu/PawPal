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

test('BaseModal 支援外部調整標題內容區樣式', () => {
  assert.match(baseModal, /titleContentClass:\s*\{\s*type:\s*String,\s*default:\s*''\s*\}/)
  assert.match(baseModal, /<div class="flex flex-col gap-1" :class="titleContentClass">/)
})

test('UserProfileModal 使用 BaseModal 引入方式呈現會員資料內容', () => {
  assert.equal(existsSync(userProfileModalUrl), true)

  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /import BaseModal from '@\/components\/common\/BaseModal\.vue'/)
  assert.match(source, /import BaseButton from '@\/components\/common\/BaseButton\.vue'/)
  assert.match(source, /import defaultProfileIcon from '@\/assets\/icons\/user\.svg'/)
  assert.match(source, /<BaseModal[\s\S]*:is-open="isOpen"[\s\S]*@close="\$emit\('close'\)"/)
  assert.match(source, /grid-cols-1[\s\S]*md:grid-cols-\[auto_1fr\]/)
  assert.match(source, /memberAvatarUrl/)
  assert.match(source, /memberDisplayName/)
  assert.match(source, /memberDisplayEmail/)
})

test('UserProfileModal 放大左側頭像並讓標題文字對齊頭像中心', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /title-content-class="w-36 items-center text-center md:w-40"/)
  assert.match(source, /grid size-36[\s\S]*md:size-40/)
  assert.match(source, /class="size-24 text-brand-gray md:size-28"/)
})

test('UserProfileModal 右下角提供前端編輯模式按鈕', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /const isEditingProfile = ref\(false\)/)
  assert.match(source, /handleStartEdit/)
  assert.match(source, /handleCancelEdit/)
  assert.match(source, /handleSaveEdit/)
  assert.match(source, /flex justify-end gap-3 border-t border-slate-100 pt-4 pr-4 md:pr-6/)
  assert.match(source, /修改資料/)
  assert.match(source, /取消/)
  assert.match(source, /儲存修改/)
})

test('UserProfileModal 編輯模式以點擊頭像更換照片取代 avatar_url 輸入欄', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /const photoFileInputRef = ref\(null\)/)
  assert.match(source, /const selectedPhotoFile = ref\(null\)/)
  assert.match(source, /const photoPreviewUrl = ref\(''\)/)
  assert.match(source, /URL\.createObjectURL\(file\)/)
  assert.match(source, /URL\.revokeObjectURL\(photoPreviewUrl\.value\)/)
  assert.match(source, /function triggerPhotoUpload\(\)/)
  assert.match(source, /function handlePhotoChange\(event\)/)
  assert.match(source, /type="file"[\s\S]*accept="image\/\*"/)
  assert.match(source, /點擊更換照片/)
  assert.doesNotMatch(source, /member-avatar-url/)
  assert.doesNotMatch(source, /placeholder="請輸入頭像網址"/)
})

test('UserProfileModal 更換頭像提示文字使用一般文字色', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /text-\[#717182\][\s\S]*點擊更換照片/)
  assert.doesNotMatch(source, /text-white[\s\S]*點擊更換照片/)
})

test('UserProfileModal 編輯模式姓名欄位使用不改變版面的內嵌輸入框', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(
    source,
    /class="mt-1 h-6 w-full border-0 bg-transparent p-0 text-base font-semibold leading-6 text-brand-darkgray outline-none placeholder-brand-gray\/40 focus:ring-0"/,
  )
  assert.match(source, /class="mt-1 h-6 truncate text-base font-semibold leading-6 text-brand-darkgray"/)
  assert.match(source, /class="block h-5 text-sm font-bold leading-5 text-brand-navy"/)
  assert.doesNotMatch(
    source,
    /class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2/,
  )
})

test('UserProfileModal 會員資料欄位外框提供 hover 與 focus 效果', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')
  const readonlyFieldClass =
    'h-[76px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3'

  assert.match(source, /const memberNameFieldClass =/)
  assert.match(source, /const editableMemberNameFieldClass =/)
  assert.equal(source.includes(readonlyFieldClass), true)
  assert.match(
    source,
    /`\$\{memberNameFieldClass\} transition duration-200 hover:border-brand-blue hover:bg-brand-blue\/5 focus-within:border-brand-blue focus-within:bg-brand-blue\/5`/,
  )
  assert.equal(source.matchAll(/hover:border-brand-blue/g).toArray().length, 2)
  assert.match(
    source,
    /:class="isEditingProfile \? editableMemberNameFieldClass : memberNameFieldClass"/,
  )
  assert.doesNotMatch(source, /focus-within:ring-4/)
})

test('AppHeader 點擊會員資訊區會開啟 UserProfileModal', () => {
  assert.match(appHeader, /import UserProfileModal from '@\/components\/member\/UserProfileModal\.vue'/)
  assert.match(appHeader, /import defaultProfileIcon from '@\/assets\/icons\/user\.svg'/)
  assert.match(appHeader, /const isUserProfileModalOpen = ref\(false\)/)
  assert.match(appHeader, /function handleOpenUserProfileModal\(\)[\s\S]*isUserProfileModalOpen\.value = true/)
  assert.match(appHeader, /aria-label="查看個人資料"[\s\S]*@click="handleOpenUserProfileModal"/)
  assert.match(appHeader, /<UserProfileModal[\s\S]*:is-open="isUserProfileModalOpen"[\s\S]*:user="authStore\.user"[\s\S]*@close="isUserProfileModalOpen = false"/)
})

test('預設會員頭像 SVG 線條顏色使用一般文字色', () => {
  assert.match(defaultUserIcon, /stroke="#717182"/)
  assert.doesNotMatch(defaultUserIcon, /stroke="currentColor"/)
})
