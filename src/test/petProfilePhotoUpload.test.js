import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const profileModal = readFileSync(
  new URL('../components/pet/PetProfileModal.vue', import.meta.url),
  'utf8',
)

test('PetProfileModal 編輯模式可重新上傳寵物照片', () => {
  assert.match(profileModal, /photoFileInputRef/)
  assert.match(profileModal, /photoPreviewUrl/)
  assert.match(profileModal, /selectedPhotoFile/)
  assert.match(profileModal, /triggerPhotoUpload/)
  assert.match(profileModal, /handlePhotoChange/)
  assert.match(profileModal, /URL\.createObjectURL/)
  assert.match(profileModal, /accept="image\/\*"/)
  assert.match(profileModal, /v-if="isEditingProfile"[\s\S]*@click="triggerPhotoUpload"/)
  assert.match(profileModal, /aria-label="重新上傳寵物照片"/)
  assert.match(profileModal, /點擊更換照片/)
})

test('PetProfileModal 照片狀態需先於編輯表單初始化', () => {
  assert.ok(
    profileModal.indexOf('const selectedPhotoFile = ref(null)') <
      profileModal.indexOf('const editForm = ref(createEditForm())'),
  )
})

test('PetProfileModal 照片 hover 效果需與輸入框一樣顯示藍色邊框', () => {
  assert.match(profileModal, /profilePhotoClass[\s\S]*hover:border-brand-blue/)
  assert.match(profileModal, /profilePhotoClass[\s\S]*focus:border-brand-blue/)
  assert.doesNotMatch(profileModal, /hover:ring-2 hover:ring-brand-blue\/20/)
  assert.doesNotMatch(profileModal, /focus:ring-2 focus:ring-brand-blue\/30/)
})

test('PetProfileModal 照片 hover 保留提示文字但不顯示陰影與遮罩', () => {
  assert.match(profileModal, /點擊更換照片/)
  assert.doesNotMatch(profileModal, /shadow-\[/)
  assert.doesNotMatch(profileModal, /bg-brand-navy\/45/)
})
