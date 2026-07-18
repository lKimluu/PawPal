import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const profileModal = readFileSync(
  new URL('../components/pet/PetProfileModal.vue', import.meta.url),
  'utf8',
)

test('寵物資料 Modal 編輯模式可重新上傳寵物照片', () => {
  assert.match(profileModal, /photoFileInputRef/)
  assert.match(profileModal, /photoPreviewUrl/)
  assert.match(profileModal, /selectedPhotoFile/)
  assert.match(profileModal, /triggerPhotoUpload/)
  assert.match(profileModal, /handlePhotoChange/)
  assert.match(profileModal, /URL\.createObjectURL/)
  assert.match(profileModal, /:accept="IMAGE_FILE_ACCEPT"/)
  assert.match(profileModal, /v-if="isEditingProfile"[\s\S]*@click="triggerPhotoUpload"/)
  assert.match(profileModal, /aria-label="重新上傳寵物照片"/)
  assert.match(profileModal, /點擊更換照片/)
})

test('寵物資料 Modal 照片狀態需先於編輯表單初始化', () => {
  assert.ok(
    profileModal.indexOf('const selectedPhotoFile = ref(null)') <
      profileModal.indexOf('const editForm = ref(createEditForm())'),
  )
})

test('寵物資料 Modal 照片 hover 效果需與輸入框一樣顯示藍色邊框', () => {
  assert.match(profileModal, /profilePhotoClass[\s\S]*hover:border-brand-blue/)
  assert.match(profileModal, /profilePhotoClass[\s\S]*focus:border-brand-blue/)
  assert.doesNotMatch(profileModal, /hover:ring-2 hover:ring-brand-blue\/20/)
  assert.doesNotMatch(profileModal, /focus:ring-2 focus:ring-brand-blue\/30/)
})

test('寵物資料 Modal 照片 hover 保留提示文字但不顯示陰影與遮罩', () => {
  assert.match(profileModal, /點擊更換照片/)
  assert.doesNotMatch(profileModal, /shadow-\[/)
  assert.doesNotMatch(profileModal, /bg-brand-navy\/45/)
})

test('寵物資料 Modal 選擇照片後先開啟裁切視窗而不是直接套用原始檔', () => {
  const photoChangeMatch = profileModal.match(/function handlePhotoChange\(event\) \{[\s\S]*?\n\}/)

  assert.ok(photoChangeMatch)
  assert.match(profileModal, /import AvatarCropModal from '@\/components\/common\/AvatarCropModal\.vue'/)
  assert.match(profileModal, /originalPhotoFile/)
  assert.match(profileModal, /cropPhotoPreviewUrl/)
  assert.match(profileModal, /isPetPhotoCropModalOpen/)
  assert.match(photoChangeMatch[0], /originalPhotoFile\.value = file/)
  assert.match(photoChangeMatch[0], /cropPhotoPreviewUrl\.value = URL\.createObjectURL\(file\)/)
  assert.match(photoChangeMatch[0], /isPetPhotoCropModalOpen\.value = true/)
  assert.doesNotMatch(photoChangeMatch[0], /selectedPhotoFile\.value = file/)
  assert.doesNotMatch(photoChangeMatch[0], /editForm\.value\.photoFile = file/)
  assert.match(
    profileModal,
    /<AvatarCropModal[\s\S]*title="裁切寵物照片"[\s\S]*:is-open="isPetPhotoCropModalOpen"[\s\S]*:image-url="cropPhotoPreviewUrl"[\s\S]*@confirm="handleConfirmPetPhotoCrop"[\s\S]*@cancel="handleCancelPetPhotoCrop"/,
  )
})

test('寵物資料 Modal 會將裁切視窗渲染在自己的堆疊範圍外', () => {
  assert.match(
    profileModal,
    /<Teleport to="body">\s*<AvatarCropModal[\s\S]*:is-open="isPetPhotoCropModalOpen"/,
  )
})

test('寵物資料 Modal 只套用裁切確認後的照片檔案', () => {
  const confirmMatch = profileModal.match(/function handleConfirmPetPhotoCrop\(croppedFile\) \{[\s\S]*?\n\}/)
  const cancelMatch = profileModal.match(/function handleCancelPetPhotoCrop\(\) \{[\s\S]*?\n\}/)

  assert.ok(confirmMatch)
  assert.match(confirmMatch[0], /selectedPhotoFile\.value = croppedFile/)
  assert.match(confirmMatch[0], /photoPreviewUrl\.value = URL\.createObjectURL\(croppedFile\)/)
  assert.match(confirmMatch[0], /editForm\.value\.photoFile = croppedFile/)
  assert.match(confirmMatch[0], /clearCropSelection\(\)/)
  assert.ok(cancelMatch)
  assert.match(cancelMatch[0], /clearCropSelection\(\)/)
  assert.doesNotMatch(cancelMatch[0], /selectedPhotoFile\.value = null/)
  assert.doesNotMatch(cancelMatch[0], /editForm\.value\.photoFile = null/)
})

test('寵物資料 Modal 照片上傳限制同步後端頭像規格', () => {
  assert.match(profileModal, /'image\/heic'/)
  assert.match(profileModal, /'image\/heif'/)
  assert.match(profileModal, /const MAX_PET_PHOTO_FILE_SIZE_BYTES = 10 \* 1024 \* 1024/)
  assert.match(profileModal, /const IMAGE_FILE_ACCEPT = 'image\/jpeg,image\/png,image\/webp,image\/heic,image\/heif,\.heic,\.heif'/)
  assert.match(profileModal, /僅支援 JPG、PNG、WebP、HEIC 或 HEIF 圖片/)
  assert.match(profileModal, /圖片檔案大小不可超過 10MB/)
  assert.doesNotMatch(profileModal, /accept="image\/\*"/)
})
