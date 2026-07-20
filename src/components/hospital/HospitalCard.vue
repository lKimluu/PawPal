<script setup>
import { computed, ref } from 'vue'
import heartFilled from '@/assets/icons/heart-filled.svg'
import heartEmpty from '@/assets/icons/heart-empty.svg'

const props = defineProps({
  hospital: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['reviewHospital'])

const isFav = ref(false)
const displayDistance = computed(() =>
  props.hospital.distance === '—' || props.hospital.distance === undefined
    ? '距離未知'
    : `${props.hospital.distance} km`,
)

const toggleFavorite = () => {
  isFav.value = !isFav.value
}
</script>

<template>
  <div
    class="group relative flex cursor-pointer items-center justify-between rounded-3xl border border-[#E2E8F0] bg-brand-white p-4 shadow-[0_4px_25px_rgba(0,0,0,0.015)] transition duration-200 active:scale-[0.999] active:bg-[#F8FAFC] md:p-6 lg:hover:border-brand-blue/30 lg:hover:shadow-[0_10px_30px_rgba(146,168,245,0.12)]"
    :class="isSelected ? 'border-brand-blue ring-2 ring-brand-blue/20' : ''"
  >
    <div class="min-w-0 flex-1">
      <div class="mb-2.5 flex flex-row flex-wrap items-center justify-start gap-1.5">
        <h3
          class="max-w-[160px] truncate text-base font-bold text-brand-navy transition duration-200 group-hover:text-brand-orange md:max-w-none md:text-lg"
        >
          {{ hospital.name }}
        </h3>
        <div class="flex shrink-0 items-center gap-1.5">
          <span
            v-if="hospital.isOpen"
            class="whitespace-nowrap rounded-full bg-brand-lightblue px-3 py-0.5 text-[10px] font-semibold text-brand-blue md:text-xs"
          >
            營業中
          </span>
          <span
            v-if="hospital.is24H"
            class="whitespace-nowrap rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-medium tracking-wider text-white md:text-xs"
          >
            24H
          </span>
        </div>
      </div>

      <div
        class="mb-2 flex flex-col gap-y-1 text-xs text-brand-gray md:flex-row md:items-center md:gap-x-2 md:text-sm"
      >
        <div class="flex shrink-0 items-center gap-x-2">
          <span class="flex items-center">
            <img
              src="@/assets/icons/pin.svg"
              alt="地區"
              class="mr-1 h-4 w-4 object-contain opacity-80"
            />
            <span class="text-brand-gray">{{ hospital.district }}</span>
          </span>
          <span class="opacity-40">|</span>
          <span class="text-brand-gray">{{ displayDistance }}</span>
        </div>
        <span class="hidden opacity-40 md:inline">|</span>
        <span class="flex items-center">
          <img
            src="@/assets/icons/clock.svg"
            alt="營業時間"
            class="mr-1 h-4 w-4 object-contain opacity-80"
          />
          <span class="text-brand-gray">{{ hospital.businessHours }}</span>
        </span>
      </div>

      <button
        type="button"
        class="flex cursor-pointer items-center rounded-full px-2 py-1 text-xs text-brand-gray transition duration-200 hover:bg-orange-50 hover:text-brand-orange active:scale-95 md:text-sm"
        @click.stop="emit('reviewHospital')"
      >
        <img src="@/assets/icons/star.svg" alt="評分" class="mr-1.5 h-4 w-4 object-contain" />
        <span class="mr-1.5 font-bold text-brand-navy md:mr-2">
          {{ Number(hospital.rating ?? 0).toFixed(1) }}
        </span>
        <span class="opacity-40">|</span>
        <span class="ml-1.5 md:ml-2">{{ hospital.reviewCount }} 則評論</span>
      </button>
    </div>

    <div class="ml-4 flex-shrink-0">
      <button
        type="button"
        class="cursor-pointer rounded-full bg-transparent p-2 transition duration-200 hover:bg-red-50"
        @click.stop="toggleFavorite"
      >
        <img :src="isFav ? heartFilled : heartEmpty" alt="收藏醫院" class="h-6 w-6 object-contain" />
      </button>
    </div>
  </div>
</template>
