<script setup>
import { computed } from 'vue'
import { getTypeMeta } from '@/constants/calendarEventTypes.js'

const props = defineProps({
  events: { type: Array, default: () => [] },
})

const MAX = 3

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
        :style="{ background: getTypeMeta(e.type).color }"
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
      :style="{ background: getTypeMeta(e.type).color }"
      class="block w-full rounded text-white px-1 py-0.5 overflow-hidden whitespace-nowrap text-ellipsis leading-tight text-xs text-center cursor-default select-none"
    >
      {{ e.title }}
    </div>
  </div>
</template>
