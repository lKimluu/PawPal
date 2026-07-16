<script setup>
import { ref, watch } from 'vue'
import AvatarCropModal from '@/components/common/AvatarCropModal.vue'

const ALLOWED_PET_PHOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])
const IMAGE_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'
const MAX_PET_PHOTO_FILE_SIZE_BYTES = 10 * 1024 * 1024

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  title: { type: String, default: '新增寵物' },
  subtitle: { type: String, default: '請填寫寵物基本資料' },
})

const emit = defineEmits(['close', 'submit'])

const validationError = ref('')
const fileInputRef = ref(null)
const originalPhotoFile = ref(null)
const cropPhotoPreviewUrl = ref('')
const isPetPhotoCropModalOpen = ref(false)

const createDefaultForm = () => ({
  name: '',
  species: '',
  customSpecies: '',
  breed: '',
  gender: '',
  birthday: '',
  weight: '',
  microchipNumber: '',
  neutered: false,
  bloodType: '',
  furColor: '',
  note: '',
  photo_files: [],
})

const form = ref(createDefaultForm())

const speciesOptions = ['狗', '貓', '其他']
const genderOptions = ['公', '母']

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-60'

const revokeObjectUrl = (url) => {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

const clearCropSelection = () => {
  revokeObjectUrl(cropPhotoPreviewUrl.value)
  originalPhotoFile.value = null
  cropPhotoPreviewUrl.value = ''
  isPetPhotoCropModalOpen.value = false
}

const resetForm = () => {
  clearCropSelection()
  form.value = createDefaultForm()
  validationError.value = ''

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const normalizeOptionalValue = (value) => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    return trimmedValue === '' ? undefined : trimmedValue
  }

  return value
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = () => {
  validationError.value = ''

  const submittedSpecies =
    form.value.species === '其他' ? form.value.customSpecies.trim() : form.value.species.trim()

  if (!form.value.name.trim()) {
    validationError.value = '請填寫寵物名稱'
    return
  }

  if (!submittedSpecies) {
    validationError.value = '請填寫寵物種類'
    return
  }

  if (form.value.weight !== '' && Number(form.value.weight) < 0) {
    validationError.value = '體重不可小於 0'
    return
  }

  const payload = {
    name: form.value.name.trim(),
    species: submittedSpecies,
    breed: normalizeOptionalValue(form.value.breed),
    gender: normalizeOptionalValue(form.value.gender),
    birthday: normalizeOptionalValue(form.value.birthday),
    weight: form.value.weight === '' ? undefined : Number(form.value.weight),
    microchipNumber: normalizeOptionalValue(form.value.microchipNumber),
    neutered: form.value.neutered,
    bloodType: normalizeOptionalValue(form.value.bloodType),
    furColor: normalizeOptionalValue(form.value.furColor),
    note: normalizeOptionalValue(form.value.note),
    avatarFile: form.value.photo_files[0] || null,
  }

  emit('submit', payload)
}

const triggerFileInput = () => {
  if (!props.isLoading) {
    fileInputRef.value?.click()
  }
}

const setPhotoFiles = (files) => {
  const file = Array.from(files ?? [])[0]

  if (!file) return

  const photoValidationError = getPhotoValidationError(file)
  if (photoValidationError) return rejectPhotoSelection(photoValidationError)

  clearCropSelection()
  originalPhotoFile.value = file
  cropPhotoPreviewUrl.value = URL.createObjectURL(file)
  isPetPhotoCropModalOpen.value = true
  validationError.value = ''
}

const handleFileChange = (event) => {
  setPhotoFiles(event.target.files)
}

const handleDrop = (event) => {
  if (!props.isLoading) {
    setPhotoFiles(event.dataTransfer?.files)
  }
}

const handleConfirmPetPhotoCrop = (croppedFile) => {
  form.value.photo_files = [croppedFile]
  clearCropSelection()

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleCancelPetPhotoCrop = () => {
  clearCropSelection()

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function getPhotoValidationError(file) {
  if (!ALLOWED_PET_PHOTO_MIME_TYPES.has(file.type)) {
    return '僅支援 JPG、PNG、WebP、HEIC 或 HEIF 圖片'
  }

  if (file.size > MAX_PET_PHOTO_FILE_SIZE_BYTES) {
    return '圖片檔案大小不可超過 10MB'
  }

  return ''
}

function rejectPhotoSelection(message) {
  validationError.value = message

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
    }
  },
)
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <section
        class="modal-card relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-6 overflow-hidden rounded-3xl bg-white pt-6 pb-6 pl-6 pr-2 text-brand-navy shadow-2xl md:pt-8 md:pb-8 md:pl-8 md:pr-2"
      >
        <div class="flex items-start justify-between gap-4 pr-4 md:pr-6">
          <div class="flex flex-col gap-1">
            <h2 class="text-2xl font-bold tracking-wide text-brand-navy">{{ title }}</h2>
            <span v-if="subtitle" class="pt-1 text-xs text-brand-gray">{{ subtitle }}</span>
          </div>

          <button
            type="button"
            class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="關閉"
            :disabled="isLoading"
            @click="handleClose"
          >
            ⨉
          </button>
        </div>

        <form class="flex min-h-0 flex-col gap-5 overflow-y-auto pr-4 md:pr-6" @submit.prevent="handleSubmit">
          <p
            v-if="validationError || errorMessage"
            class="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          >
            {{ validationError || errorMessage }}
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                寵物名稱
                <span class="font-normal text-red-600">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="請輸入寵物名稱"
                :class="inputClass"
                :disabled="isLoading"
                required
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                種類
                <span class="font-normal text-red-600">*</span>
              </label>
              <select v-model="form.species" :class="inputClass" :disabled="isLoading" required>
                <option value="" disabled>請選擇種類</option>
                <option v-for="species in speciesOptions" :key="species" :value="species">
                  {{ species }}
                </option>
              </select>
              <input
                v-if="form.species === '其他'"
                v-model="form.customSpecies"
                type="text"
                maxlength="50"
                placeholder="請輸入寵物種類"
                :class="inputClass"
                :disabled="isLoading"
                required
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">品種</label>
              <input
                v-model="form.breed"
                type="text"
                placeholder="例如：傑克羅素"
                :class="inputClass"
                :disabled="isLoading"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">性別</label>
              <select v-model="form.gender" :class="inputClass" :disabled="isLoading">
                <option value="">請選擇性別</option>
                <option v-for="gender in genderOptions" :key="gender" :value="gender">
                  {{ gender }}
                </option>
              </select>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">生日</label>
              <input v-model="form.birthday" type="date" :class="inputClass" :disabled="isLoading" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">體重</label>
              <div class="relative">
                <input
                  v-model="form.weight"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="例如：12"
                  :class="`${inputClass} pr-12`"
                  :disabled="isLoading"
                />
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                >
                  kg
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">晶片號碼</label>
              <input
                v-model="form.microchipNumber"
                type="text"
                placeholder="請輸入晶片號碼"
                :class="inputClass"
                :disabled="isLoading"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">血型</label>
              <input
                v-model="form.bloodType"
                type="text"
                placeholder="例如：DEA 1.1"
                :class="inputClass"
                :disabled="isLoading"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">毛色</label>
              <input
                v-model="form.furColor"
                type="text"
                placeholder="例如：黑色"
                :class="inputClass"
                :disabled="isLoading"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">結紮狀態</label>
              <label
                class="flex h-full min-h-[46px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-brand-darkgray transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5"
                :class="{ 'cursor-not-allowed opacity-60': isLoading }"
              >
                <input
                  v-model="form.neutered"
                  type="checkbox"
                  class="h-4 w-4 accent-brand-blue"
                  :disabled="isLoading"
                />
                已結紮
              </label>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">上傳寵物大頭貼</label>
            <input
              ref="fileInputRef"
              type="file"
              :accept="IMAGE_FILE_ACCEPT"
              class="hidden"
              :disabled="isLoading"
              @change="handleFileChange"
            />
            <div
              class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-blue/30 bg-brand-blue/5 py-5 transition duration-200 hover:border-brand-blue hover:bg-brand-blue/10"
              :class="{ 'cursor-not-allowed opacity-60': isLoading }"
              @click="triggerFileInput"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <div class="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <img
                  class="h-5 w-5 object-contain"
                  src="@/assets/icons/paper-clip.svg"
                  alt="上傳附件"
                />
                <span>
                  {{
                    form.photo_files.length
                      ? `已選擇 ${form.photo_files[0].name}`
                      : '上傳或拖曳一張寵物照片...'
                  }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">備註</label>
            <textarea
              v-model="form.note"
              rows="3"
              placeholder="請輸入生活習慣、注意事項或其他備註"
              :class="`${inputClass} resize-none`"
              :disabled="isLoading"
            ></textarea>
          </div>

          <div class="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              class="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isLoading"
              @click="handleClose"
            >
              取消
            </button>
            <button
              type="submit"
              class="cursor-pointer rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition duration-200 hover:bg-[#7b94ee] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isLoading"
            >
              {{ isLoading ? '送出中...' : '新增寵物' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </Transition>

  <AvatarCropModal
    title="裁切寵物照片"
    subtitle="拖曳圖片並調整縮放，確認寵物照片的圓形顯示範圍"
    :is-open="isPetPhotoCropModalOpen"
    :image-url="cropPhotoPreviewUrl"
    :file-name="originalPhotoFile?.name || 'pet-photo.webp'"
    @confirm="handleConfirmPetPhotoCrop"
    @cancel="handleCancelPetPhotoCrop"
  />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-card,
.fade-leave-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-enter-from .modal-card,
.fade-leave-to .modal-card {
  transform: scale(0.95);
}
</style>
