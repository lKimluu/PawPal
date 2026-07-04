<script setup>
import { computed } from 'vue'
import { usePetStore } from '@/stores/petStore'
import { getTypeMeta } from '@/constants/calendarEventTypes.js'

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

const petStore = usePetStore()

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

const dateObj = computed(() => new Date(props.event.eventDate))
const formattedMonth = computed(() => dateObj.value.getMonth() + 1)
const formattedDay = computed(() => String(dateObj.value.getDate()).padStart(2, '0'))
const weekday = computed(() => WEEKDAYS[dateObj.value.getDay()])

// 後端 response 無 petName，改由 petId 查 petStore
const petName = computed(
  () => petStore.pets.find((p) => p.id === props.event.petId)?.name ?? '',
)
const displayTitle = computed(() =>
  petName.value ? `${petName.value} - ${props.event.title}` : props.event.title,
)

const typeMeta = computed(() => getTypeMeta(props.event.type))
const typeIconSrc = computed(() => typeMeta.value.icon)
const typeIconBg = computed(() => typeMeta.value.bg)
// 後端 response 無 tag，改由 type 對應中文 label 與樣式
const tagLabel = computed(() => typeMeta.value.label)
const tagStyle = computed(() => typeMeta.value.chip)
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
            {{ tagLabel }}
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
          {{ displayTitle }}
        </p>

        <div v-if="event.eventTime || event.location" class="flex items-center gap-1 mt-1 flex-wrap">
          <span v-if="event.eventTime" class="flex items-center gap-1">
            <img src="@/assets/icons/clock-icon.svg" alt="" class="w-3 h-3" />
            <span class="text-xs md:text-sm text-gray-500">{{ event.eventTime }}</span>
          </span>
          <span v-if="event.location" class="flex items-center gap-0.5">
            <img src="@/assets/icons/location-dot.svg" alt="" class="w-3 h-3" />
            <span class="text-xs md:text-sm text-gray-400">{{ event.location }}</span>
          </span>
        </div>

        <p v-if="event.notes" class="text-xs md:text-sm text-gray-400 mt-1 leading-relaxed">
          {{ event.notes }}
        </p>

        <!-- tag：手機版顯示在此（md+ 一律隱藏，compact 時已在日期欄顯示） -->
        <div class="mt-2 md:hidden">
          <span class="inline-block text-xs px-2 py-0.5 rounded-full font-medium" :class="tagStyle">
            {{ tagLabel }}
          </span>
        </div>
      </div>

      <!-- 桌面版按鈕區：compact=true 時不渲染 -->
      <div v-if="!compact" class="hidden md:flex items-center gap-3 flex-shrink-0">
        <span class="inline-block text-xs px-3 py-1 rounded-full font-medium" :class="tagStyle">
          {{ tagLabel }}
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
