<script setup>
const activeTab = defineModel({
  type: String,
  default: '全部',
})

const tabs = ['全部', '看診', '疫苗', '手術', '用藥', '體檢', '其他']
</script>

<template>
  <div
    class="flex w-full items-center gap-2 overflow-x-auto rounded-xl px-1 py-1.5 md:gap-4 md:px-4 md:py-3"
  >
    <button
      v-for="tab in tabs"
      :key="tab"
      type="button"
      class="shrink-0 cursor-pointer rounded-3xl md:rounded-full px-3 py-1.5 text-xs font-bold shadow-[0_3px_10px_rgba(31,41,55,0.06)] transition duration-200 active:scale-95 md:tracking-wide md:px-5 md:py-2 md:text-sm lg:px-6 lg:py-2"
      :class="
        activeTab === tab
          ? 'bg-brand-blue text-brand-white shadow-[0_8px_18px_rgba(146,168,245,0.36)]'
          : 'bg-brand-white text-brand-gray hover:text-brand-blue'
      "
      @click="activeTab = tab"
    >
      {{ tab }}
    </button>
  </div>
</template>
