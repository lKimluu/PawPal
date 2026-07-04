<script setup>
import { onBeforeUnmount, nextTick, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const ITEM_HEIGHT = 40
const VISIBLE_COUNT = 3
const PADDING = (ITEM_HEIGHT * (VISIBLE_COUNT - 1)) / 2

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const isOpen = ref(false)
const containerRef = ref(null)
const hourListRef = ref(null)
const minuteListRef = ref(null)

const selectedHour = ref('00')
const selectedMinute = ref('00')

let hourScrollTimer = null
let minuteScrollTimer = null

const scrollToIndex = (el, index, behavior = 'auto') => {
  if (!el) return
  el.scrollTo({ top: index * ITEM_HEIGHT, behavior })
}

const parseModelValue = () => {
  const [h, m] = (props.modelValue || '00:00').split(':')
  selectedHour.value = hours.includes(h) ? h : '00'
  selectedMinute.value = minutes.includes(m) ? m : '00'
}

const openPicker = async () => {
  parseModelValue()
  isOpen.value = true
  await nextTick()
  scrollToIndex(hourListRef.value, hours.indexOf(selectedHour.value))
  scrollToIndex(minuteListRef.value, minutes.indexOf(selectedMinute.value))
}

const toggle = () => {
  if (isOpen.value) {
    isOpen.value = false
  } else {
    openPicker()
  }
}

const emitValue = () => {
  emit('update:modelValue', `${selectedHour.value}:${selectedMinute.value}`)
}

const handleHourScroll = (event) => {
  clearTimeout(hourScrollTimer)
  const el = event.target
  hourScrollTimer = setTimeout(() => {
    const index = Math.min(hours.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)))
    selectedHour.value = hours[index]
    scrollToIndex(el, index, 'smooth')
    emitValue()
  }, 120)
}

const handleMinuteScroll = (event) => {
  clearTimeout(minuteScrollTimer)
  const el = event.target
  minuteScrollTimer = setTimeout(() => {
    const index = Math.min(minutes.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)))
    selectedMinute.value = minutes[index]
    scrollToIndex(el, index, 'smooth')
    emitValue()
  }, 120)
}

const handleClear = () => {
  emit('update:modelValue', '')
  isOpen.value = false
}

const handleDone = () => {
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('mousedown', handleClickOutside)
  } else {
    document.removeEventListener('mousedown', handleClickOutside)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearTimeout(hourScrollTimer)
  clearTimeout(minuteScrollTimer)
})
</script>

<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      @click="toggle"
      class="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-left text-sm outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
      :class="modelValue ? 'text-brand-darkgray' : 'text-brand-gray/40'"
    >
      {{ modelValue || '請選擇時間' }}
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 top-full z-30 mt-2 w-full rounded-2xl border border-slate-100 bg-white p-3 shadow-xl"
    >
      <div class="relative flex items-center justify-center gap-1">
        <div
          class="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-brand-blue/10"
        ></div>

        <div
          ref="hourListRef"
          class="scrollbar-hide relative h-[120px] w-16 snap-y snap-mandatory overflow-y-auto overscroll-contain"
          @scroll="handleHourScroll"
        >
          <div :style="{ height: `${PADDING}px` }"></div>
          <div
            v-for="h in hours"
            :key="h"
            class="flex h-10 snap-center items-center justify-center text-lg transition duration-150"
            :class="h === selectedHour ? ' text-brand-navy' : 'text-brand-gray/50'"
          >
            {{ h }}
          </div>
          <div :style="{ height: `${PADDING}px` }"></div>
        </div>

        <span class="text-lg text-brand-navy">:</span>

        <div
          ref="minuteListRef"
          class="scrollbar-hide relative h-[120px] w-16 snap-y snap-mandatory overflow-y-auto overscroll-contain"
          @scroll="handleMinuteScroll"
        >
          <div :style="{ height: `${PADDING}px` }"></div>
          <div
            v-for="m in minutes"
            :key="m"
            class="flex h-10 snap-center items-center justify-center text-lg transition duration-150"
            :class="m === selectedMinute ? ' text-brand-navy' : 'text-brand-gray/50'"
          >
            {{ m }}
          </div>
          <div :style="{ height: `${PADDING}px` }"></div>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          v-if="modelValue"
          type="button"
          @click="handleClear"
          class="cursor-pointer text-xs font-semibold text-brand-gray transition duration-200 hover:text-red-500"
        >
          清除
        </button>
        <span v-else></span>
        <button
          type="button"
          @click="handleDone"
          class="cursor-pointer text-xs text-brand-blue transition duration-200 hover:text-[#7b94ee]"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
