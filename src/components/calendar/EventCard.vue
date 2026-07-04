<script setup>
import { computed } from 'vue'
import checkupIcon from '@/assets/icons/checkup-icon.svg'
import vaccineIcon from '@/assets/icons/vaccine-icon.svg'
import medicineIcon from '@/assets/icons/medicine-icon.svg'
import groomingIcon from '@/assets/icons/grooming-icon.svg'
import dewormingIcon from '@/assets/icons/bugs.svg'
import defaultIcon from '@/assets/icons/default-icon.svg'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit', 'delete'])

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

const dateObj = computed(() => new Date(props.event.date))
const formattedMonth = computed(() => dateObj.value.getMonth() + 1)
const formattedDay = computed(() => String(dateObj.value.getDate()).padStart(2, '0'))
const weekday = computed(() => WEEKDAYS[dateObj.value.getDay()])

const TYPE_MAP = {
  checkup: { icon: checkupIcon, bg: 'bg-purple-100' },
  vaccine: { icon: vaccineIcon, bg: 'bg-indigo-50' },
  medicine: { icon: medicineIcon, bg: 'bg-yellow-50' },
  grooming: { icon: groomingIcon, bg: 'bg-teal-100' },
  deworming: { icon: dewormingIcon, bg: 'bg-green-100' },
}

const typeIconSrc = computed(() => TYPE_MAP[props.event.type]?.icon ?? defaultIcon)
const typeIconBg = computed(() => TYPE_MAP[props.event.type]?.bg ?? 'bg-gray-100')

const TAG_STYLE_MAP = {
  回診: 'bg-purple-100 text-purple-600',
  疫苗: 'bg-indigo-50  text-blue-400',
  服藥: 'bg-yellow-50  text-yellow-500',
  美容: 'bg-teal-100   text-teal-600',
  除蟲: 'bg-green-100  text-green-600',
  用藥提醒: 'bg-red-100    text-red-500',
}

const tagStyle = computed(() => TAG_STYLE_MAP[props.event.tag] ?? 'bg-gray-100 text-gray-500')
</script>

<template>
  <div class="bg-white rounded-2xl p-4 md:p-5 mb-3 shadow-sm border border-gray-100">
    <div class="flex items-start gap-3 md:gap-4">
      <!-- 日期欄：compact 時 icon + tag 只在 md+ 搬入此欄 -->
      <div class="flex flex-col items-center min-w-[44px] md:min-w-[56px]">
        <span class="text-sm md:text-base font-semibold text-gray-800 leading-tight">
          {{ formattedMonth }}/{{ formattedDay }}
        </span>
        <span class="text-xs text-gray-400 mt-0.5">{{ weekday }}</span>

        <template v-if="compact">
          <div
            class="hidden md:flex items-center justify-center w-8 h-8 rounded-full mt-2 flex-shrink-0"
            :class="typeIconBg"
          >
            <img :src="typeIconSrc" alt="" class="w-4 h-4" />
          </div>
          <span
            class="hidden md:inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium text-center whitespace-nowrap"
            :class="tagStyle"
          >
            {{ event.tag }}
          </span>
        </template>
      </div>

      <!-- icon：compact 時 md+ 隱藏（已搬至日期欄），手機維持顯示 -->
      <div
        class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full mt-0.5 flex-shrink-0"
        :class="[typeIconBg, compact ? 'md:hidden' : '']"
      >
        <img :src="typeIconSrc" alt="" class="w-4 h-4 md:w-5 md:h-5" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm md:text-base font-semibold text-gray-900 leading-snug">
          {{ event.petName }} - {{ event.title }}
        </p>

        <div v-if="event.time || event.location" class="flex items-center gap-1 mt-1 flex-wrap">
          <span v-if="event.time" class="flex items-center gap-1">
            <img src="@/assets/icons/clock-icon.svg" alt="" class="w-3 h-3" />
            <span class="text-xs md:text-sm text-gray-500">{{ event.time }}</span>
          </span>
          <span v-if="event.location" class="flex items-center gap-0.5">
            <img src="@/assets/icons/location-dot.svg" alt="" class="w-3 h-3" />
            <span class="text-xs md:text-sm text-gray-400">{{ event.location }}</span>
          </span>
        </div>

        <p v-if="event.note" class="text-xs md:text-sm text-gray-400 mt-1 leading-relaxed">
          {{ event.note }}
        </p>

        <!-- tag：手機版顯示在此（md+ 一律隱藏，compact 時已在日期欄顯示） -->
        <div class="mt-2 md:hidden">
          <span class="inline-block text-xs px-2 py-0.5 rounded-full font-medium" :class="tagStyle">
            {{ event.tag }}
          </span>
        </div>
      </div>

      <!-- 桌面版按鈕區：compact=true 時不渲染 -->
      <div v-if="!compact" class="hidden md:flex items-center gap-3 flex-shrink-0">
        <span class="inline-block text-xs px-3 py-1 rounded-full font-medium" :class="tagStyle">
          {{ event.tag }}
        </span>
        <button
          @click="$emit('edit', event)"
          class="cursor-pointer hover:opacity-70 text-gray-400 hover:text-blue-500 transition-colors p-1"
          aria-label="編輯"
        >
          <img src="@/assets/icons/edit-icon.svg" alt="編輯" class="w-4 h-4" />
        </button>
        <button
          @click="$emit('delete', event)"
          class="cursor-pointer hover:opacity-70 text-gray-400 hover:text-red-500 transition-colors p-1"
          aria-label="刪除"
        >
          <img src="@/assets/icons/delete-icon.svg" alt="刪除" class="w-4 h-4" />
        </button>
      </div>

      <!-- 手機版按鈕區：compact=true 時永遠顯示，否則 md+ 隱藏 -->
      <div
        :class="
          compact
            ? 'flex flex-col gap-2 flex-shrink-0 ml-1'
            : 'flex flex-col gap-2 flex-shrink-0 ml-1 md:hidden'
        "
      >
        <button
          @click="$emit('edit', event)"
          class="cursor-pointer text-gray-400 hover:text-blue-500 transition-colors p-1"
          aria-label="編輯"
        >
          <img src="@/assets/icons/edit-icon.svg" alt="編輯" class="w-4 h-4" />
        </button>
        <button
          @click="$emit('delete', event)"
          class="cursor-pointer text-gray-400 hover:text-red-500 transition-colors p-1"
          aria-label="刪除"
        >
          <img src="@/assets/icons/delete-icon.svg" alt="刪除" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
