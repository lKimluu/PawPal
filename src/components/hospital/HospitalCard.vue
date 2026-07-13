<script setup>
import { computed } from 'vue'
import heartFilled from '@/assets/icons/heart-filled.svg'
import heartEmpty from '@/assets/icons/heart-empty.svg'
import { useFavoriteHospitalStore } from '@/stores/favoriteHospital'

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

const favoriteHospitalStore = useFavoriteHospitalStore()
const isFav = computed(() => favoriteHospitalStore.isFavorite(props.hospital.id))

const toggleFavorite = () => {
  favoriteHospitalStore.toggleFavorite(props.hospital.id)
}
</script>

<template>
  <div
    class="group relative flex items-center justify-between bg-brand-white rounded-3xl p-4 md:p-6 border border-[#E2E8F0] shadow-[0_4px_25px_rgba(0,0,0,0.015)] transition duration-200 lg:hover:shadow-[0_10px_30px_rgba(146,168,245,0.12)] lg:hover:border-brand-blue/30 active:bg-[#F8FAFC] active:scale-[0.999] cursor-pointer"
    :class="isSelected ? 'border-brand-blue ring-2 ring-brand-blue/20' : ''"
  >
    <div class="flex-1 min-w-0">
      <div class="flex flex-row flex-wrap items-center justify-start gap-1.5 mb-2.5">
        <h3
          class="font-bold text-brand-navy text-base md:text-lg group-hover:text-brand-orange transition duration-200 truncate max-w-[160px] md:max-w-none"
        >
          {{ hospital.name }}
        </h3>
        <div class="flex items-center gap-1.5 shrink-0">
          <span
            v-if="hospital.isOpen"
            class="text-[10px] md:text-xs font-semibold px-3 py-0.5 rounded-full bg-brand-lightblue text-brand-blue whitespace-nowrap"
          >
            營業中
          </span>
          <span
            v-if="hospital.is24H"
            class="text-[10px] md:text-xs font-medium tracking-wider px-2 py-0.5 rounded-full bg-brand-orange text-white whitespace-nowrap"
          >
            24H
          </span>
        </div>
      </div>
      <div
        class="flex flex-col md:flex-row md:items-center text-xs md:text-sm text-brand-gray gap-y-1 md:gap-x-2 mb-2"
      >
        <div class="flex items-center gap-x-2 shrink-0">
          <span class="flex items-center">
            <img
              src="@/assets/icons/pin.svg"
              alt="位置"
              class="w-4 h-4 mr-1 object-contain opacity-80"
            />
            <span class="text-brand-gray">{{ hospital.district }}</span>
          </span>
          <span class="opacity-40">·</span>
          <span class="text-brand-gray">{{ hospital.distance }} km</span>
        </div>
        <span class="hidden md:inline opacity-40">·</span>
        <span class="flex items-center">
          <img
            src="@/assets/icons/clock.svg"
            alt="時間"
            class="w-4 h-4 mr-1 object-contain opacity-80"
          />
          <span class="text-brand-gray">{{ hospital.businessHours }}</span>
        </span>
      </div>
      <div class="flex items-center text-xs md:text-sm text-brand-gray">
        <img src="@/assets/icons/star.svg" alt="評分" class="w-4 h-4mr-1.5 object-contain" />
        <span class="font-bold text-brand-navy mr-1.5 md:mr-2">
          {{ Number(hospital.rating ?? 0).toFixed(1) }}
        </span>
        <span class="opacity-40">·</span>
        <span class="ml-1.5 md:ml-2">{{ hospital.reviewCount }} 則評論</span>
      </div>
    </div>
    <div class="ml-4 flex-shrink-0">
      <button
        type="button"
        @click.stop="toggleFavorite"
        class="cursor-pointer p-2 rounded-full bg-transparent hover:bg-red-50 transition duration-200"
      >
        <img
          :src="isFav ? heartFilled : heartEmpty"
          alt="收藏按鈕"
          class="w-6 h-6 object-contain"
        />
      </button>
    </div>
  </div>
</template>
