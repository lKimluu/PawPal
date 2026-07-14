<script setup>
defineProps({
  city: {
    type: String,
    default: '',
  },
  district: {
    type: String,
    default: '',
  },
  regions: {
    type: Array,
    default: () => [],
  },
  districts: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['cityChange', 'districtChange'])
</script>

<template>
  <div class="mt-3 grid grid-cols-2 gap-2">
    <div class="relative">
      <select
        class="peer h-10 w-full appearance-none rounded-xl bg-brand-lightblue/50 pl-3 pr-10 text-[13px] cursor-pointer"
        :value="city"
        :disabled="isLoading"
        @change="emit('cityChange', $event.target.value)"
      >
        <option value="">全部縣市</option>
        <option v-for="region in regions" :key="region.city" :value="region.city">
          {{ region.city }}
        </option>
      </select>
      <svg
        class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 peer-disabled:opacity-50"
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

    <div class="relative">
      <select
        class="peer h-10 w-full appearance-none rounded-xl bg-brand-lightblue/50 pl-3 pr-10 text-[13px] cursor-pointer"
        :value="district"
        :disabled="!city"
        @change="emit('districtChange', $event.target.value)"
      >
        <option value="">全部行政區</option>
        <option v-for="item in districts" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
      <svg
        class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 peer-disabled:opacity-50"
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
  </div>
</template>
