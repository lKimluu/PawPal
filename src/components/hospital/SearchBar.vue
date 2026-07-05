<script setup>
import { computed, ref } from 'vue'

const keyword = ref('')
const isOpenOnly = ref(true)
const isEmergencyOnly = ref(false)
const selectedCategory = ref('全部')

const categories = [
  '全部',
  '24H 急診',
  '犬貓',
  '外科手術',
  '牙科',
  '預防醫學',
  '重症加護',
  '急救',
  '皮膚科',
  '異寵',
  '鳥類',
  '影像診斷',
  '心臟科',
]

const matchedCount = computed(() => {
  if (selectedCategory.value === '24H 急診' || isEmergencyOnly.value) {
    return 2
  }

  return keyword.value.trim() ? 3 : 5
})
</script>

<template>
  <section
    class="w-full rounded-[18px] bg-brand-white px-6 py-7 text-brand-navy shadow-[0_10px_35px_rgba(31,41,55,0.16)] md:px-8"
  >
    <h2 class="text-[15px] font-bold tracking-wide">搜尋</h2>

    <label class="mt-3 flex h-11 items-center gap-2 rounded-xl bg-brand-lightblue/50 px-4">
      <img src="@/assets/icons/search.svg" alt="" class="h-4 w-4 opacity-70" />
      <input
        v-model="keyword"
        class="h-full min-w-0 flex-1 bg-transparent text-[14px] font-medium text-brand-navy outline-none placeholder:text-brand-gray/60"
        type="search"
        placeholder="醫院名稱、地區、地址"
      />
    </label>

    <div class="mt-5 space-y-3">
      <div class="flex items-center justify-between gap-4 text-[14px] font-normal text-brand-navy">
        <span>只顯示營業中</span>
        <button
          type="button"
          class="relative h-5 w-10 cursor-pointer rounded-full transition"
          :class="isOpenOnly ? 'bg-brand-blue' : 'bg-brand-gray/30'"
          aria-label="只顯示營業中"
          @click="isOpenOnly = !isOpenOnly"
        >
          <span
            class="absolute top-0.5 h-4 w-4 rounded-full bg-brand-white shadow-sm transition"
            :class="isOpenOnly ? 'left-[22px]' : 'left-0.5'"
          ></span>
        </button>
      </div>

      <div class="flex items-center justify-between gap-4 text-[14px] font-normal text-brand-navy">
        <span>24 小時急診</span>
        <button
          type="button"
          class="relative h-5 w-10 cursor-pointer rounded-full transition"
          :class="isEmergencyOnly ? 'bg-brand-blue' : 'bg-brand-gray/30'"
          aria-label="24 小時急診"
          @click="isEmergencyOnly = !isEmergencyOnly"
        >
          <span
            class="absolute top-0.5 h-4 w-4 rounded-full bg-brand-white shadow-sm transition"
            :class="isEmergencyOnly ? 'left-[22px]' : 'left-0.5'"
          ></span>
        </button>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-[15px] font-bold tracking-wide">看診類別</h3>

      <div class="mt-4 flex gap-2 overflow-x-auto pb-2 pr-1">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-bold whitespace-nowrap transition active:scale-95"
          :class="
            selectedCategory === category
              ? 'border-brand-blue bg-brand-blue text-brand-white shadow-[0_5px_14px_rgba(146,168,245,0.35)]'
              : 'border-brand-lightblue bg-brand-white text-brand-navy hover:border-brand-blue hover:text-brand-blue'
          "
          @click="selectedCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <p class="mt-6 text-[13px] font-medium text-brand-gray">
      找到 <span class="font-bold text-brand-orange">{{ matchedCount }}</span> 間醫院
    </p>
  </section>
</template>
