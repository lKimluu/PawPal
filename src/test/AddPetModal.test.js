import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

function assertPetPhotoCropFlow(source) {
  const setPhotoFilesMatch = source.match(/const setPhotoFiles = \(files\) => \{[\s\S]*?\n\}/)
  const confirmMatch = source.match(/const handleConfirmPetPhotoCrop = \(croppedFile\) => \{[\s\S]*?\n\}/)
  const cancelMatch = source.match(/const handleCancelPetPhotoCrop = \(\) => \{[\s\S]*?\n\}/)

  assert.ok(setPhotoFilesMatch)
  assert.match(source, /import AvatarCropModal from '@\/components\/common\/AvatarCropModal\.vue'/)
  assert.match(source, /originalPhotoFile/)
  assert.match(source, /cropPhotoPreviewUrl/)
  assert.match(source, /isPetPhotoCropModalOpen/)
  assert.match(setPhotoFilesMatch[0], /originalPhotoFile\.value = file/)
  assert.match(setPhotoFilesMatch[0], /cropPhotoPreviewUrl\.value = URL\.createObjectURL\(file\)/)
  assert.match(setPhotoFilesMatch[0], /isPetPhotoCropModalOpen\.value = true/)
  assert.doesNotMatch(setPhotoFilesMatch[0], /form\.value\.photo_files = Array\.from/)
  assert.match(
    source,
    /<AvatarCropModal[\s\S]*title="裁切寵物照片"[\s\S]*:is-open="isPetPhotoCropModalOpen"[\s\S]*:image-url="cropPhotoPreviewUrl"[\s\S]*@confirm="handleConfirmPetPhotoCrop"[\s\S]*@cancel="handleCancelPetPhotoCrop"/,
  )
  assert.ok(confirmMatch)
  assert.match(confirmMatch[0], /form\.value\.photo_files = \[croppedFile\]/)
  assert.match(confirmMatch[0], /clearCropSelection\(\)/)
  assert.ok(cancelMatch)
  assert.match(cancelMatch[0], /clearCropSelection\(\)/)
  assert.doesNotMatch(cancelMatch[0], /form\.value\.photo_files = \[\]/)
}

test('新增寵物 Modal 選擇照片後先開啟裁切視窗並只套用確認後的檔案', () => {
  assertPetPhotoCropFlow(source)
})

test('新增寵物 Modal 照片上傳限制同步後端頭像規格', () => {
  assert.match(source, /'image\/heic'/)
  assert.match(source, /'image\/heif'/)
  assert.match(source, /const MAX_PET_PHOTO_FILE_SIZE_BYTES = 10 \* 1024 \* 1024/)
  assert.match(source, /const IMAGE_FILE_ACCEPT = 'image\/jpeg,image\/png,image\/webp,image\/heic,image\/heif,\.heic,\.heif'/)
  assert.match(source, /:accept="IMAGE_FILE_ACCEPT"/)
  assert.match(source, /僅支援 JPG、PNG、WebP、HEIC 或 HEIF 圖片/)
  assert.match(source, /圖片檔案大小不可超過 10MB/)
  assert.doesNotMatch(source, /accept="image\/\*"/)
})

const source = readFileSync(
  new URL('../components/pet/AddPetModal.vue', import.meta.url),
  'utf8',
)

test('新增寵物表單支援其他種類並送出自訂種類欄位', () => {
  assert.match(source, /customSpecies:\s*''/)
  assert.match(source, /form\.species\s*={2,3}\s*'其他'/)
  assert.match(source, /v-model="form\.customSpecies"/)
  assert.match(source, /maxlength="50"/)
})

test('新增寵物表單送出時會用自訂種類覆蓋 species 欄位', () => {
  assert.match(source, /const submittedSpecies\s*=/)
  assert.match(source, /form\.value\.customSpecies\.trim\(\)/)
  assert.match(source, /species:\s*submittedSpecies/)
  assert.doesNotMatch(source, /customSpecies:\s*form\.value\.customSpecies/)
})

test('新增寵物表單關閉時會重置資料', () => {
  assert.match(
    source,
    /const handleClose\s*=\s*\(\)\s*=>\s*{[\s\S]*?resetForm\(\)\s*emit\('close'\)\s*}/,
  )
})

test('新增寵物性別不是必填且不能出現未知選項', () => {
  assert.match(source, /const genderOptions = \['公', '母'\]/)
  assert.doesNotMatch(source, /if \(!form\.value\.gender\)/)
  assert.doesNotMatch(source, /validationError\.value = '請選擇寵物性別'/)
  assert.doesNotMatch(source, /<select v-model="form\.gender"[\s\S]*required/)
  assert.doesNotMatch(source, /'未知'/)
  assert.doesNotMatch(source, />未知</)
})

test('新增寵物表單不再使用圖片網址欄位並改走檔案上傳流程', () => {
  assert.doesNotMatch(source, /圖片網址/)
  assert.doesNotMatch(source, /form\.photoUrl/)
  assert.match(source, /photo_files:\s*\[\]/)
  assert.match(source, /avatarFile:\s*form\.value\.photo_files\[0\]\s*\|\|\s*null/)
  assert.match(source, /上傳寵物大頭貼/)
})
