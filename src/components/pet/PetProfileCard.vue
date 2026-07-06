<script setup>
import { computed } from 'vue'
import { formatPetBirthday, formatPetGender } from '@/utils/petDisplay.js'

const props = defineProps({
  pet: {
    type: Object,
    required: true,
  },
})

const neuteredLabel = computed(() => (props.pet.neutered ? '已結紮' : '未結紮'))

const weightDisplay = computed(() => {
  if (!props.pet.weight) return '—'
  return `${props.pet.weight} kg`
})

const genderDisplay = computed(() => formatPetGender(props.pet.gender))
const birthdayDisplay = computed(() => formatPetBirthday(props.pet.birthday))
</script>

<template>
  <div class="pet-profile-card max-w-[1024px] mx-auto px-4 flex justify-center">
    <div
      class="flex flex-col md:flex-row md:gap-10 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:p-6"
    >
      <div
        class="flex items-center md:flex-col md:items-start gap-4 md:gap-2 p-4 md:p-0 border-b md:border-0 border-gray-200 md:min-w-[160px]"
      >
        <div
          class="w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center"
        >
          <img
            v-if="pet.photoUrl"
            :src="pet.photoUrl"
            :alt="pet.name"
            class="w-full h-full object-cover"
          />
          <img
            v-else
            src="@/assets/icons/paw.svg"
            class="w-8 h-8 md:w-12 md:h-12 opacity-30"
            alt="寵物"
          />
        </div>

        <div class="md:mt-2">
          <div class="flex items-center gap-2">
            <span class="text-lg md:text-2xl text-gray-700">{{ pet.name }}</span>
            <button
              class="cursor-pointer hover:opacity-70 transition-opacity p-1"
              aria-label="編輯"
            >
              <img src="@/assets/icons/edit-icon.svg" class="w-4 h-4" alt="編輯" />
            </button>
          </div>
          <p class="text-xs md:text-sm text-gray-500 md:mt-0.5">
            {{ pet.breed }}<span class="md:hidden">・{{ genderDisplay }}</span>
          </p>
          <p class="hidden md:block text-sm text-gray-500 mt-0.5">{{ genderDisplay }}</p>
          <p class="text-xs md:text-sm text-gray-500 mt-0.5">
            {{ pet.age }} （{{ birthdayDisplay }}）
          </p>
        </div>
      </div>

      <div class="flex flex-col px-4 md:px-0 md:pt-2 divide-y divide-gray-300">
        <div class="flex items-baseline gap-2 py-2">
          <span class="text-sm text-[var(--color-brand-gray)] w-20 flex-shrink-0">體重</span>
          <span class="text-sm text-gray-700">{{ weightDisplay }}</span>
        </div>
        <div class="flex items-baseline gap-2 py-2">
          <span class="text-sm text-[var(--color-brand-gray)] w-20 flex-shrink-0">晶片號碼</span>
          <span class="text-sm text-gray-700 break-all">{{ pet.microchipNumber || '—' }}</span>
        </div>
        <div class="flex items-baseline gap-2 py-2">
          <span class="text-sm text-[var(--color-brand-gray)] w-20 flex-shrink-0">結紮狀態</span>
          <span class="text-sm text-gray-700">{{ neuteredLabel }}</span>
        </div>
        <div v-if="pet.bloodType" class="flex items-baseline gap-2 py-2">
          <span class="text-sm text-[var(--color-brand-gray)] w-20 flex-shrink-0">血型</span>
          <span class="text-sm text-gray-700">{{ pet.bloodType }}</span>
        </div>
        <div v-if="pet.furColor" class="flex items-baseline gap-2 py-2">
          <span class="text-sm text-[var(--color-brand-gray)] w-20 flex-shrink-0">毛色</span>
          <span class="text-sm text-gray-700">{{ pet.furColor }}</span>
        </div>
        <div v-if="pet.note" class="flex items-baseline gap-2 py-2">
          <span class="text-sm text-[var(--color-brand-gray)] w-20 flex-shrink-0">備註</span>
          <span class="text-sm text-gray-700">{{ pet.note }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
