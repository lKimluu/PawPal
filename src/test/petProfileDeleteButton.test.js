import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const baseButton = readFileSync(new URL('../components/common/BaseButton.vue', import.meta.url), 'utf8')
const profileModal = readFileSync(new URL('../components/pet/PetProfileModal.vue', import.meta.url), 'utf8')

test('BaseButton 支援規範橘色按鈕樣式', () => {
  assert.match(baseButton, /'orange'/)
  assert.match(baseButton, /orange:\s*'bg-brand-orange text-white/)
})

test('PetProfileModal 非編輯模式在修改資料左邊顯示刪除資料按鈕', () => {
  const deleteButtonIndex = profileModal.indexOf('刪除資料')
  const editButtonIndex = profileModal.indexOf('修改資料')

  assert.match(profileModal, /defineEmits\(\['close', 'update', 'delete'\]\)/)
  assert.match(profileModal, /function handleDeleteProfile\(\)/)
  assert.match(profileModal, /emit\('delete', props\.pet\)/)
  assert.match(profileModal, /variant="orange"[\s\S]*@click="handleDeleteProfile"/)
  assert.ok(deleteButtonIndex !== -1)
  assert.ok(editButtonIndex !== -1)
  assert.ok(deleteButtonIndex < editButtonIndex)
})

test('PetProfileModal 編輯模式取消按鈕使用與刪除資料相同的橘色樣式', () => {
  assert.match(
    profileModal,
    /<BaseButton[\s\S]*?variant="orange"[\s\S]*?@click="handleCancelEdit"[\s\S]*?>[\s\S]*?取消[\s\S]*?<\/BaseButton>/,
  )
})

test('PetProfileModal footer 操作按鈕固定同寬', () => {
  assert.match(profileModal, /<BaseButton[^>]*class="min-w-\[96px\]"[^>]*@click="handleDeleteProfile"/)
  assert.match(profileModal, /<BaseButton[^>]*class="min-w-\[96px\]"[^>]*@click="handleStartEdit"/)
  assert.match(profileModal, /<BaseButton[^>]*class="min-w-\[96px\]"[^>]*@click="handleCancelEdit"/)
  assert.match(profileModal, /<BaseButton[^>]*class="min-w-\[96px\]"[^>]*@click="handleSaveEdit"/)
})
