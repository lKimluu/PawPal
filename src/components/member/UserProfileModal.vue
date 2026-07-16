<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useAuthStore } from '@/stores/auth'
import {
  getUserAvatarUrl,
  getUserDisplayEmail,
  getUserDisplayName,
  hasUserAvatar,
} from '@/utils/userProfile.js'
import defaultProfileIcon from '@/assets/icons/user.svg'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

defineEmits(['close'])

const authStore = useAuthStore()
const isEditingProfile = ref(false)
const isSaving = ref(false)
const updateError = ref('')
const photoFileInputRef = ref(null)
const selectedPhotoFile = ref(null)
const photoPreviewUrl = ref('')
const localProfile = ref(createProfileForm(props.user))
const editForm = ref(createProfileForm(props.user))
const memberNameFieldClass = 'h-[76px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3'
const editableMemberNameFieldClass = `${memberNameFieldClass} transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus-within:border-brand-blue focus-within:bg-brand-blue/5`
const memberEmailFieldClass = 'rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3'
const readonlyMemberEmailFieldClass = 'rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3'

const displayUser = computed(() => ({
  ...(props.user ?? {}),
  ...localProfile.value,
}))
const memberAvatarUrl = computed(() => getUserAvatarUrl(displayUser.value))
const hasUploadedAvatar = computed(() => hasUserAvatar(displayUser.value))
const memberDisplayName = computed(() => getUserDisplayName(displayUser.value))
const memberDisplayEmail = computed(() => getUserDisplayEmail(props.user))
const editAvatarUrl = computed(() => photoPreviewUrl.value || memberAvatarUrl.value)
const hasEditAvatar = computed(() => editAvatarUrl.value !== '')

function createProfileForm(user) {
  return {
    name: typeof user?.name === 'string' ? user.name : '',
  }
}

function clearPhotoSelection() {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }

  selectedPhotoFile.value = null
  photoPreviewUrl.value = ''

  if (photoFileInputRef.value) {
    photoFileInputRef.value.value = ''
  }
}

function syncLocalProfileFromUser(user) {
  localProfile.value = createProfileForm(user)
}

function resetEditForm() {
  editForm.value = { ...localProfile.value }
}

function handleStartEdit() {
  syncLocalProfileFromUser(authStore.user || props.user)
  resetEditForm()
  updateError.value = ''
  isEditingProfile.value = true
}

function handleCancelEdit() {
  syncLocalProfileFromUser(authStore.user || props.user)
  resetEditForm()
  updateError.value = ''
  clearPhotoSelection()
  isEditingProfile.value = false
}

async function handleSaveEdit() {
  if (isSaving.value) return

  const trimmedName = editForm.value.name.trim()
  updateError.value = ''

  if (!trimmedName) {
    updateError.value = '姓名不可空白'
    return
  }

  isSaving.value = true

  try {
    const result = await authStore.updateProfile({
      name: trimmedName,
      avatarFile: selectedPhotoFile.value,
    })

    if (!result.success) {
      updateError.value = result.message
      return
    }

    const updatedUser = result.data?.user || authStore.user

    localProfile.value = createProfileForm(updatedUser)
    resetEditForm()
    clearPhotoSelection()
    updateError.value = ''
    isEditingProfile.value = false
  } finally {
    isSaving.value = false
  }
}

function triggerPhotoUpload() {
  if (!isEditingProfile.value) return
  photoFileInputRef.value?.click()
}

function handlePhotoChange(event) {
  const file = event.target.files?.[0]

  if (!file) return

  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }

  selectedPhotoFile.value = file
  photoPreviewUrl.value = URL.createObjectURL(file)
}

watch(
  () => [props.isOpen, props.user],
  () => {
    clearPhotoSelection()
    syncLocalProfileFromUser(authStore.user || props.user)
    resetEditForm()
    updateError.value = ''
    isEditingProfile.value = false
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="個人資料"
    subtitle="目前登入會員資訊"
    title-content-class="w-36 items-center text-center md:w-40"
    @close="$emit('close')"
  >
    <section class="flex flex-col gap-6">
      <div
        class="grid grid-cols-1 gap-6 overflow-y-auto pr-4 text-brand-navy md:grid-cols-[auto_1fr] md:items-center md:gap-8 md:pr-6"
      >
        <input
          ref="photoFileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handlePhotoChange"
        />

        <button
          v-if="isEditingProfile"
          type="button"
          class="group relative mx-auto grid size-36 cursor-pointer place-items-center overflow-hidden rounded-full border border-[#D6DDE8] bg-white p-0 shadow-sm transition duration-200 hover:border-brand-blue focus:border-brand-blue focus:outline-none md:size-40"
          aria-label="重新上傳會員頭像"
          @click="triggerPhotoUpload"
        >
          <img
            v-if="hasEditAvatar"
            :src="editAvatarUrl"
            alt="會員頭像"
            class="size-full object-cover"
          />
          <img
            v-else
            :src="defaultProfileIcon"
            alt="預設會員頭像"
            class="size-24 text-brand-gray md:size-28"
          />
          <span
            class="absolute inset-0 flex items-center justify-center px-4 text-sm font-bold text-[#717182] opacity-0 transition duration-200 group-hover:opacity-100 group-focus:opacity-100"
          >
            點擊更換照片
          </span>
        </button>

        <div
          v-else
          class="mx-auto grid size-36 place-items-center overflow-hidden rounded-full border border-[#D6DDE8] bg-white shadow-sm md:size-40"
        >
          <img
            v-if="hasUploadedAvatar"
            :src="memberAvatarUrl"
            alt="會員頭像"
            class="size-full object-cover"
          />
          <img
            v-else
            :src="defaultProfileIcon"
            alt="預設會員頭像"
            class="size-24 text-brand-gray md:size-28"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-4">
          <div :class="isEditingProfile ? editableMemberNameFieldClass : memberNameFieldClass">
            <label
              v-if="isEditingProfile"
              for="member-name"
              class="block h-5 text-sm font-bold leading-5 text-brand-navy"
            >
              姓名 / 使用者名稱
            </label>
            <p v-else class="block h-5 text-sm font-bold leading-5 text-brand-navy">
              姓名 / 使用者名稱
            </p>
            <input
              v-if="isEditingProfile"
              id="member-name"
              v-model="editForm.name"
              type="text"
              class="mt-1 h-6 w-full border-0 bg-transparent p-0 text-base font-semibold leading-6 text-brand-darkgray outline-none placeholder-brand-gray/40 focus:ring-0"
              placeholder="請輸入姓名"
            />
            <p
              v-else
              class="mt-1 h-6 truncate text-base font-semibold leading-6 text-brand-darkgray"
            >
              {{ memberDisplayName }}
            </p>
          </div>

          <div :class="isEditingProfile ? readonlyMemberEmailFieldClass : memberEmailFieldClass">
            <div class="flex items-center gap-2">
              <p class="text-sm font-bold text-brand-navy">Email</p>
              <span v-if="isEditingProfile" class="text-xs font-normal text-brand-gray/70">
                （無法修改）
              </span>
            </div>
            <p
              class="mt-1 w-full truncate text-base font-semibold"
              :class="
                isEditingProfile ? 'cursor-not-allowed text-brand-gray' : 'text-brand-darkgray'
              "
              :title="isEditingProfile ? 'Email 無法修改' : undefined"
            >
              {{ memberDisplayEmail }}
            </p>
          </div>
        </div>
      </div>

      <p v-if="updateError" class="px-1 text-sm font-semibold text-red-500 md:px-0" role="alert">
        {{ updateError }}
      </p>

      <div class="flex justify-end gap-3 border-t border-slate-100 pt-4 pr-4 md:pr-6">
        <template v-if="!isEditingProfile">
          <BaseButton class="min-w-[96px]" @click="handleStartEdit">修改資料</BaseButton>
        </template>
        <template v-else>
          <BaseButton variant="orange" class="min-w-[96px]" @click="handleCancelEdit">
            取消
          </BaseButton>
          <BaseButton class="min-w-[96px]" :disabled="isSaving" @click="handleSaveEdit">
            {{ isSaving ? '儲存中...' : '儲存修改' }}
          </BaseButton>
        </template>
      </div>
    </section>
  </BaseModal>
</template>
