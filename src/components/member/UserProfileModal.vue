<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
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

const memberAvatarUrl = computed(() => getUserAvatarUrl(props.user))
const hasUploadedAvatar = computed(() => hasUserAvatar(props.user))
const memberDisplayName = computed(() => getUserDisplayName(props.user))
const memberDisplayEmail = computed(() => getUserDisplayEmail(props.user))
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="個人資料"
    subtitle="目前登入會員資訊"
    @close="$emit('close')"
  >
    <section
      class="grid grid-cols-1 gap-6 overflow-y-auto pr-4 text-brand-navy md:grid-cols-[auto_1fr] md:items-center md:gap-8 md:pr-6"
    >
      <div class="mx-auto grid size-28 place-items-center overflow-hidden rounded-full border border-[#D6DDE8] bg-white shadow-sm md:size-32">
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
          class="size-20 text-brand-gray md:size-24"
        />
      </div>

      <div class="flex min-w-0 flex-col gap-4">
        <div class="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p class="text-sm font-bold text-brand-navy">姓名 / 使用者名稱</p>
          <p class="mt-1 truncate text-base font-semibold text-brand-darkgray">
            {{ memberDisplayName }}
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p class="text-sm font-bold text-brand-navy">Email</p>
          <p class="mt-1 truncate text-base font-semibold text-brand-darkgray">
            {{ memberDisplayEmail }}
          </p>
        </div>
      </div>
    </section>
  </BaseModal>
</template>
