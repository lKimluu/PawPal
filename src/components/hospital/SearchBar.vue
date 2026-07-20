<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import HospitalLocationSelects from '@/components/hospital/HospitalLocationSelects.vue'
import HospitalSearchInput from '@/components/hospital/HospitalSearchInput.vue'
import { useHospitalStore } from '@/stores/hospital.js'
import { HOSPITAL_ANIMAL_TYPES, HOSPITAL_SORT_OPTIONS } from '@/constants/hospitalFilters.js'

const hospitalStore = useHospitalStore()
const {
  filters,
  regions,
  availableDistricts,
  pagination,
  isLoading,
  regionsLoading,
  regionsError,
  hasRealLocation,
} = storeToRefs(hospitalStore)
const keyword = ref(filters.value.keyword)

watch(
  () => filters.value.keyword,
  (value) => {
    keyword.value = value
  },
)

function submitSearch() {
  hospitalStore.setKeyword(keyword.value)
}

function changeCity(city) {
  hospitalStore.setLocationFilter({ city, district: '' })
}

function changeDistrict(district) {
  hospitalStore.setLocationFilter({ city: filters.value.city, district })
}

function changeSort(event) {
  hospitalStore.setSort(event.target.value)
}
</script>

<template>
  <section
    class="w-full rounded-[18px] bg-brand-white px-6 py-7 text-brand-navy shadow-[0_10px_35px_rgba(31,41,55,0.16)] md:px-8"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-[15px] font-bold">搜尋</h2>
      <button
        class="cursor-pointer text-xs font-bold text-brand-blue transition hover:text-brand-orange active:scale-95 active:text-brand-orange"
        type="button"
        @click="hospitalStore.clearFilters"
      >
        清除條件
      </button>
    </div>

    <HospitalSearchInput v-model="keyword" :is-loading="isLoading" @submit="submitSearch" />

    <HospitalLocationSelects
      :city="filters.city"
      :district="filters.district"
      :regions="regions"
      :districts="availableDistricts"
      :is-loading="regionsLoading"
      @city-change="changeCity"
      @district-change="changeDistrict"
    />

    <div v-if="regionsError" class="mt-2 flex items-center gap-2 text-xs text-brand-orange">
      <span>{{ regionsError }}</span>
      <button
        class="font-bold underline transition active:scale-95 active:text-brand-navy"
        type="button"
        @click="hospitalStore.loadRegions"
      >
        重試
      </button>
    </div>

    <div class="mt-5 flex items-center justify-between text-sm">
      <span>24 小時營業</span>
      <button
        type="button"
        class="relative h-5 w-10 cursor-pointer rounded-full transition active:scale-95"
        :class="filters.is24H ? 'bg-brand-blue' : 'bg-brand-gray/30'"
        @click="hospitalStore.set24H(!filters.is24H)"
      >
        <span
          class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition"
          :class="filters.is24H ? 'left-[22px]' : 'left-0.5'"
        ></span>
      </button>
    </div>

    <div class="mt-5 flex items-center justify-between text-sm">
      <span>收藏清單</span>
      <button
        type="button"
        class="relative h-5 w-10 cursor-pointer rounded-full transition active:scale-95"
        :class="filters.favoritesOnly ? 'bg-brand-blue' : 'bg-brand-gray/30'"
        @click="hospitalStore.setFavoritesOnly(!filters.favoritesOnly)"
      >
        <span
          class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition"
          :class="filters.favoritesOnly ? 'left-[22px]' : 'left-0.5'"
        ></span>
      </button>
    </div>

    <div class="mt-5">
      <h3 class="text-[15px] font-bold">診療動物</h3>
      <div class="mt-3 flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="item in HOSPITAL_ANIMAL_TYPES"
          :key="item.value || 'all'"
          class="shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95"
          :class="
            filters.animalType === item.value
              ? 'border-brand-blue bg-brand-blue text-white'
              : 'border-brand-lightblue'
          "
          type="button"
          @click="hospitalStore.setAnimalType(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <label class="mt-4 block text-xs font-bold"
      >排序
      <div class="relative mt-2">
        <select
          class="h-10 w-full appearance-none rounded-xl bg-brand-lightblue/50 pl-3 pr-10 text-[13px] cursor-pointer"
          :value="filters.sort"
          @change="changeSort"
        >
          <option
            v-for="item in HOSPITAL_SORT_OPTIONS"
            :key="item.value"
            :value="item.value"
            :disabled="item.requiresLocation && !hasRealLocation"
          >
            {{ item.label }}
          </option>
        </select>
        <svg
          class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </label>

    <p class="mt-5 text-[13px] text-brand-gray">
      找到 <span class="font-bold text-brand-orange">{{ pagination.total }}</span> 間醫院
    </p>
  </section>
</template>
