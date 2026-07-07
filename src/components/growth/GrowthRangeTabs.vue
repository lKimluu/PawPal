<script setup>
import { ref } from 'vue'

const emit = defineEmits(['change'])

const ranges = ['3 個月', '6 個月', '1 年']
const activeRange = ref('6 個月')

function selectRange(range) {
  activeRange.value = range
  emit('change', range)
}
</script>

<template>
  <div
    class="flex w-full items-center gap-2 overflow-x-auto rounded-xl px-3 py-3 md:gap-4 md:px-4 md:py-3"
  >
    <button
      v-for="range in ranges"
      :key="range"
      type="button"
      class="shrink-0 cursor-pointer rounded-3xl md:rounded-full px-2.5 py-1 text-sm font-bold shadow-[0_3px_10px_rgba(31,41,55,0.1)] transition active:scale-95 md:tracking-wide md:px-4 md:py-2 md:text-sm lg:px-4 lg:py-2 lg:text-base"
      :class="
        activeRange === range
          ? 'bg-brand-blue text-brand-white shadow-[0_8px_18px_rgba(146,168,245,0.36)]'
          : 'bg-brand-white text-brand-gray hover:text-brand-blue'
      "
      @click="selectRange(range)"
    >
      {{ range }}
    </button>
  </div>
</template>
