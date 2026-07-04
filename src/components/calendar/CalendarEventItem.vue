<script setup>
import { computed } from 'vue'

const props = defineProps({
  events: { type: Array, default: () => [] },
})

const MAX = 3

// 這邊暫時以mock data 定義為主，之後會改成真資料
const colorMap = {
  checkup: '#EF7C7C',
  vaccine: '#4CC9A4',
  medicine: '#FFA94D',
  grooming: '#A78BFA',
  deworming: '#60A5FA',
  other: '#9CA3AF',
}

const visible = computed(() => props.events.slice(0, MAX))
const overflow = computed(() => Math.max(0, props.events.length - MAX))
</script>

<template>
  <!-- 手機：圓點 + more... 在右下角 -->
  <div class="flex flex-col gap-0.5 mt-1 w-full md:hidden">
    <div class="flex gap-1 ml-1">
      <span
        v-for="e in visible"
        :key="e.id"
        :style="{ background: colorMap[e.type] ?? colorMap.other }"
        class="w-1.5 h-1.5 rounded-full shrink-0"
      />
    </div>
    <span
      v-if="overflow > 0"
      class="absolute bottom-1 right-1 text-[9px] text-brand-blue font-medium leading-none"
    >
      more...
    </span>
  </div>

  <!-- 平板／電腦：彩色長條 + 標題 (md+) -->
  <div class="hidden md:flex flex-col gap-0.5 mt-0.5 w-full min-w-0 overflow-hidden">
    <div
      v-for="e in visible"
      :key="e.id"
      :style="{ background: colorMap[e.type] ?? colorMap.other }"
      class="block w-full rounded text-white px-1 py-0.5 overflow-hidden whitespace-nowrap text-ellipsis leading-tight text-xs text-center cursor-default select-none"
    >
      {{ e.title }}
    </div>
  </div>
</template>
