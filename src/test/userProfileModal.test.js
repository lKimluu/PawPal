import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const userProfileModalUrl = new URL('../components/member/UserProfileModal.vue', import.meta.url)
const avatarCropModalUrl = new URL('../components/common/AvatarCropModal.vue', import.meta.url)
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

test('共用 BaseModal 提供內容插槽給外部 modal 引入使用', () => {
  assert.match(baseModal, /<slot>/)
  assert.match(baseModal, /<\/slot>/)
})

test('共用 BaseModal 支援外部調整標題內容區樣式', () => {
  assert.match(baseModal, /titleContentClass:\s*\{\s*type:\s*String,\s*default:\s*''\s*\}/)
  assert.match(baseModal, /<div class="flex flex-col gap-1" :class="titleContentClass">/)
})

test('會員資料視窗使用 BaseModal 引入方式呈現會員資料內容', () => {
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

test('會員資料視窗放大左側頭像並讓標題文字對齊頭像中心', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /title-content-class="w-36 items-center text-center md:w-40"/)
  assert.match(source, /grid size-36[\s\S]*md:size-40/)
  assert.match(source, /class="size-24 text-brand-gray md:size-28"/)
})

test('會員資料視窗右下角提供前端編輯模式按鈕', () => {
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

test('會員資料視窗編輯模式以點擊頭像更換照片取代 avatar_url 輸入欄', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /const photoFileInputRef = ref\(null\)/)
  assert.match(source, /const originalPhotoFile = ref\(null\)/)
  assert.match(source, /const selectedPhotoFile = ref\(null\)/)
  assert.match(source, /const photoPreviewUrl = ref\(''\)/)
  assert.match(source, /const cropPhotoPreviewUrl = ref\(''\)/)
  assert.match(source, /const isAvatarCropModalOpen = ref\(false\)/)
  assert.match(source, /URL\.revokeObjectURL\(photoPreviewUrl\.value\)/)
  assert.match(source, /function triggerPhotoUpload\(\)/)
  assert.match(source, /function handlePhotoChange\(event\)/)
  assert.match(source, /type="file"[\s\S]*:accept="IMAGE_FILE_ACCEPT"/)
  assert.match(source, /點擊更換照片/)
  assert.doesNotMatch(source, /member-avatar-url/)
  assert.doesNotMatch(source, /placeholder="請輸入頭像網址"/)
})

test('會員資料視窗更換頭像提示文字使用一般文字色', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /text-\[#717182\][\s\S]*點擊更換照片/)
  assert.doesNotMatch(source, /text-white[\s\S]*點擊更換照片/)
})

test('會員資料視窗編輯模式姓名欄位使用不改變版面的內嵌輸入框', () => {
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

test('會員資料視窗的資料欄位外框提供 hover 與 focus 效果', () => {
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

test('會員資料視窗儲存姓名時會呼叫 auth store 並送出去除空白的 name', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /import \{ useAuthStore \} from '@\/stores\/auth'/)
  assert.match(source, /const authStore = useAuthStore\(\)/)
  assert.match(source, /async function handleSaveEdit\(\)/)
  assert.match(source, /const trimmedName = editForm\.value\.name\.trim\(\)/)
  assert.match(
    source,
    /await authStore\.updateProfile\(\{\s*name: trimmedName,\s*avatarFile: selectedPhotoFile\.value,\s*\}\)/,
  )
})

test('會員資料視窗姓名空白時顯示錯誤且不送出會員更新 API', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /const updateError = ref\(''\)/)
  assert.match(source, /if \(!trimmedName\) \{[\s\S]*updateError\.value = '[^']+'[\s\S]*return[\s\S]*\}/)
  assert.doesNotMatch(source, /authStore\.updateProfile\(\{[\s\S]*name: editForm\.value\.name/)
})

test('會員資料視窗更新成功後以後端會員資料刷新畫面並退出編輯模式', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /const updatedUser = result\.data\?\.user \|\| authStore\.user/)
  assert.match(source, /localProfile\.value = createProfileForm\(updatedUser\)/)
  assert.match(source, /resetEditForm\(\)/)
  assert.match(source, /clearPhotoSelection\(\)/)
  assert.match(source, /updateError\.value = ''/)
  assert.match(source, /isEditingProfile\.value = false/)
})

test('會員資料視窗更新失敗時保留編輯模式並顯示錯誤訊息', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')
  const failureMatch = source.match(/if \(!result\.success\) \{[\s\S]*?^\s*\}/m)

  assert.ok(failureMatch)
  assert.match(failureMatch[0], /updateError\.value = result\.message/)
  assert.match(failureMatch[0], /return/)
  assert.doesNotMatch(failureMatch[0], /resetEditForm\(\)/)
  assert.doesNotMatch(failureMatch[0], /isEditingProfile\.value = false/)
  assert.match(source, /v-if="updateError"/)
  assert.match(source, /\{\{ updateError \}\}/)
})

test('會員資料視窗儲存期間會鎖定按鈕避免重複送出', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /const isSaving = ref\(false\)/)
  assert.match(source, /if \(isSaving\.value\) return/)
  assert.match(source, /isSaving\.value = true/)
  assert.match(source, /finally \{[\s\S]*isSaving\.value = false[\s\S]*\}/)
  assert.match(source, /:disabled="isSaving"/)
  assert.match(source, /儲存中\.\.\./)
})

test('會員資料視窗取消編輯會還原最新會員資料且不呼叫 API', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')
  const cancelMatch = source.match(/function handleCancelEdit\(\) \{[\s\S]*?\n\}/)

  assert.ok(cancelMatch)
  assert.match(cancelMatch[0], /syncLocalProfileFromUser\(authStore\.user \|\| props\.user\)/)
  assert.match(cancelMatch[0], /updateError\.value = ''/)
  assert.match(cancelMatch[0], /clearPhotoSelection\(\)/)
  assert.match(cancelMatch[0], /isEditingProfile\.value = false/)
  assert.doesNotMatch(cancelMatch[0], /authStore\.updateProfile/)
})

test('會員資料視窗不會把 blob 預覽網址當成 avatar_url 傳給後端', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')
  const saveMatch = source.match(/async function handleSaveEdit\(\) \{[\s\S]*?\n\}/)

  assert.ok(saveMatch)
  assert.doesNotMatch(saveMatch[0], /avatar_url/)
  assert.doesNotMatch(saveMatch[0], /photoPreviewUrl/)
  assert.doesNotMatch(saveMatch[0], /selectedAvatarUrl/)
  assert.match(source, /URL\.createObjectURL\(file\)/)
})

test('會員資料 Modal 選擇頭像後先開啟裁切視窗而不是直接套用原始檔', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')
  const photoChangeMatch = source.match(/function handlePhotoChange\(event\) \{[\s\S]*?\n\}/)

  assert.ok(photoChangeMatch)
  assert.match(source, /import AvatarCropModal from '@\/components\/common\/AvatarCropModal\.vue'/)
  assert.match(photoChangeMatch[0], /originalPhotoFile\.value = file/)
  assert.match(photoChangeMatch[0], /cropPhotoPreviewUrl\.value = URL\.createObjectURL\(file\)/)
  assert.match(photoChangeMatch[0], /isAvatarCropModalOpen\.value = true/)
  assert.doesNotMatch(photoChangeMatch[0], /selectedPhotoFile\.value = file/)
  assert.doesNotMatch(photoChangeMatch[0], /photoPreviewUrl\.value = URL\.createObjectURL\(file\)/)
  assert.match(
    source,
    /<AvatarCropModal[\s\S]*:is-open="isAvatarCropModalOpen"[\s\S]*:image-url="cropPhotoPreviewUrl"[\s\S]*@confirm="handleConfirmAvatarCrop"[\s\S]*@cancel="handleCancelAvatarCrop"/,
  )
})

test('會員資料 Modal 只在裁切確認後把裁切檔案設為真正上傳檔案', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')
  const confirmMatch = source.match(/function handleConfirmAvatarCrop\(croppedFile\) \{[\s\S]*?\n\}/)

  assert.ok(confirmMatch)
  assert.match(confirmMatch[0], /selectedPhotoFile\.value = croppedFile/)
  assert.match(confirmMatch[0], /photoPreviewUrl\.value = URL\.createObjectURL\(croppedFile\)/)
  assert.match(confirmMatch[0], /isAvatarCropModalOpen\.value = false/)
  assert.match(confirmMatch[0], /clearCropSelection\(\)/)
})

test('會員資料 Modal 裁切取消或關閉不覆蓋已確認的預覽圖片', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')
  const cancelMatch = source.match(/function handleCancelAvatarCrop\(\) \{[\s\S]*?\n\}/)

  assert.ok(cancelMatch)
  assert.match(cancelMatch[0], /isAvatarCropModalOpen\.value = false/)
  assert.match(cancelMatch[0], /clearCropSelection\(\)/)
  assert.doesNotMatch(cancelMatch[0], /selectedPhotoFile\.value = null/)
  assert.doesNotMatch(cancelMatch[0], /photoPreviewUrl\.value = ''/)
})

test('會員資料 Modal 頭像上傳限制同步後端頭像規格', () => {
  const source = readFileSync(userProfileModalUrl, 'utf8')

  assert.match(source, /'image\/heic'/)
  assert.match(source, /'image\/heif'/)
  assert.match(source, /const MAX_AVATAR_FILE_SIZE_BYTES = 10 \* 1024 \* 1024/)
  assert.match(source, /const IMAGE_FILE_ACCEPT = 'image\/jpeg,image\/png,image\/webp,image\/heic,image\/heif,\.heic,\.heif'/)
  assert.match(source, /僅支援 JPG、PNG、WebP、HEIC 或 HEIF 圖片/)
  assert.match(source, /圖片檔案大小不可超過 10MB/)
  assert.doesNotMatch(source, /accept="image\/\*"/)
})

test('頭像裁切視窗使用 vue-advanced-cropper 產生 512 方形裁切圖片', () => {
  assert.equal(existsSync(avatarCropModalUrl), true)

  const source = readFileSync(avatarCropModalUrl, 'utf8')

  assert.match(source, /import \{ CircleStencil, Cropper \} from 'vue-advanced-cropper'/)
  assert.match(source, /import 'vue-advanced-cropper\/dist\/style\.css'/)
  assert.match(source, /defineEmits\(\['confirm', 'cancel'\]\)/)
  assert.match(source, /:stencil-component="CircleStencil"/)
  assert.match(source, /width: 512/)
  assert.match(source, /height: 512/)
  assert.match(source, /canvas\.toBlob/)
  assert.match(source, /new File\(\[blob\]/)
})

test('頭像裁切視窗在瀏覽器無法預覽 HEIC 或 HEIF 時顯示明確提示', () => {
  const source = readFileSync(avatarCropModalUrl, 'utf8')

  assert.match(source, /function isLikelyHeicFile\(fileName\)/)
  assert.match(source, /heic\|heif/)
  assert.match(source, /此瀏覽器無法預覽 HEIC\/HEIF 圖片，請改用 JPG、PNG 或 WebP 後再上傳/)
  assert.match(source, /isLikelyHeicFile\(props\.fileName\)/)
  assert.match(source, /const canConfirm = computed\(\(\) => props\.imageUrl && !isProcessing\.value && !cropError\.value\)/)
})

test('頭像裁切視窗縮放圖片時維持圓形裁切框固定', () => {
  const source = readFileSync(avatarCropModalUrl, 'utf8')

  assert.match(source, /const MAX_STENCIL_SIZE = 280/)
  assert.match(source, /function getFixedStencilSize\(\{ boundaries \}\)/)
  assert.match(source, /:stencil-size="getFixedStencilSize"/)
  assert.match(source, /const resizeImageSettings = \{/)
  assert.match(source, /adjustStencil: false/)
  assert.match(source, /wheel: false/)
  assert.match(source, /touch: false/)
  assert.match(source, /resizable: false/)
  assert.match(source, /movable: false/)
})

test('頁首所有已上傳會員頭像都使用 object-cover object-center', () => {
  const uploadedAvatarClasses = appHeader
    .match(/v-if="hasUploadedAvatar"[\s\S]*?class="([^"]+)"/g)
    ?.map((match) => match.match(/class="([^"]+)"/)?.[1] ?? '')

  assert.ok(uploadedAvatarClasses?.length >= 2)

  for (const className of uploadedAvatarClasses) {
    assert.match(className, /object-cover/)
    assert.match(className, /object-center/)
  }
})

test('頁首透過個人資料選項開啟會員資料視窗', () => {
  assert.match(appHeader, /import UserProfileModal from '@\/components\/member\/UserProfileModal\.vue'/)
  assert.match(appHeader, /import defaultProfileIcon from '@\/assets\/icons\/user\.svg'/)
  assert.match(appHeader, /const isUserProfileModalOpen = ref\(false\)/)
  assert.match(appHeader, /function handleOpenUserProfileModal\(\)[\s\S]*isUserProfileModalOpen\.value = true/)
  assert.match(appHeader, />\s*個人資料\s*<\/button>/)
  assert.match(appHeader, /@click="handleOpenUserProfileModal"/)
  assert.match(appHeader, /<UserProfileModal[\s\S]*:is-open="isUserProfileModalOpen"[\s\S]*:user="authStore\.user"[\s\S]*@close="isUserProfileModalOpen = false"/)
})

test('預設會員頭像 SVG 線條顏色使用一般文字色', () => {
  assert.match(defaultUserIcon, /stroke="#717182"/)
  assert.doesNotMatch(defaultUserIcon, /stroke="currentColor"/)
})

test('頭像裁切視窗拉動縮放軸時只縮放圖片且不改變裁切框大小', () => {
  const source = readFileSync(avatarCropModalUrl, 'utf8')

  assert.match(source, /const ZOOM_SLIDER_MAX = 100/)
  assert.match(source, /const MAX_RELATIVE_ZOOM_SCALE = 5/)
  assert.match(source, /const ZOOM_SENSITIVITY = Math\.log\(MAX_RELATIVE_ZOOM_SCALE\) \/ ZOOM_SLIDER_MAX/)
  assert.match(source, /function getZoomFactor\(previousZoomValue, nextZoomValue\)/)
  assert.match(source, /Math\.exp\(\(nextZoomValue - previousZoomValue\) \* ZOOM_SENSITIVITY\)/)
  assert.match(source, /const zoomFactor = getZoomFactor\(zoomValue\.value, nextZoomValue\)/)
  assert.match(source, /if \(zoomFactor !== 1\) \{/)
  assert.match(source, /max="ZOOM_SLIDER_MAX"/)
  assert.doesNotMatch(source, /max="3"/)
  assert.doesNotMatch(source, /currentZoomScale/)
  assert.doesNotMatch(source, /Math\.pow/)
})

test('頭像裁切視窗關閉 cropper 縮放動畫以維持拉軸即時回饋', () => {
  const source = readFileSync(avatarCropModalUrl, 'utf8')

  assert.match(source, /const zoomOptions = \{\s*transitions: false,\s*\}/)
  assert.match(source, /cropperRef\.value\?\.zoom\(zoomFactor, undefined, zoomOptions\)/)
})

test('頭像裁切視窗初始圖片縮放為剛好覆蓋固定圓框的最小比例', () => {
  const source = readFileSync(avatarCropModalUrl, 'utf8')

  assert.match(source, /default-boundaries="fit"/)
  assert.match(source, /:auto-zoom="false"/)
  assert.match(source, /image-restriction="stencil"/)
  assert.match(source, /zoomValue = ref\(0\)/)
  assert.doesNotMatch(source, /currentZoomScale/)
})
