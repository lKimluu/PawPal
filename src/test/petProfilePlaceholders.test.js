import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const profileModal = readFileSync(
  new URL('../components/pet/PetProfileModal.vue', import.meta.url),
  'utf8',
)

test('PetProfileModal 編輯模式左側三格顯示名稱品種性別 placeholder', () => {
  assert.match(profileModal, /v-model="editForm\.name"[\s\S]*placeholder="請輸入寵物名稱"/)
  assert.match(profileModal, /v-model="editForm\.breed"[\s\S]*placeholder="請輸入寵物品種"/)
  assert.match(
    profileModal,
    /v-model="editForm\.gender"[\s\S]*<option value="" disabled>請選擇寵物性別<\/option>/,
  )
})
