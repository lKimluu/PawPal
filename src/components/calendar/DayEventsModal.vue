<script setup>
import { computed } from 'vue'
import { usePetStore } from '@/stores/petStore'
import { getTypeMeta } from '@/constants/calendarEventTypes.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  date: { type: String, default: '' }, // YYYY-MM-DD
  events: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'add', 'edit', 'delete', 'resync'])

const petStore = usePetStore()

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

// 標題「M月D日」：直接拆字串，避免時區偏移
const dateTitle = computed(() => {
  if (!props.date) return ''
  const [, m, d] = props.date.split('-')
  return `${Number(m)}月${Number(d)}日`
})

const weekdayLabel = computed(() => {
  if (!props.date) return ''
  const [y, m, d] = props.date.split('-').map(Number)
  return WEEKDAYS[new Date(y, m - 1, d).getDay()]
})

// 左側色條 / tag chip / 中文 label 皆由 type 對應共用 meta
const barColor = (event) => getTypeMeta(event.type).color
const tagStyle = (event) => getTypeMeta(event.type).chip
const tagLabel = (event) => getTypeMeta(event.type).label
// 後端 response 無 petName，改由 petId 查 petStore
const petNameOf = (event) => petStore.pets.find((p) => p.id === event.petId)?.name ?? ''

const handleClose = () => emit('close')
const handleAdd = () => emit('add', props.date)
</script>

<template>
  <Transition name="fade">
    <!-- 背景半透明遮罩 -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <!-- 白底卡片 -->
      <div
        class="modal-card relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-6 overflow-hidden rounded-3xl bg-white pt-6 pb-6 pl-6 pr-2 shadow-2xl md:pt-8 md:pb-8 md:pr-2 md:pl-8"
      >
        <!-- 頂部標頭與 X 關閉鈕 -->
        <div class="flex items-start justify-between pr-4 md:pr-6">
          <div class="flex items-baseline gap-1">
            <h2 class="text-2xl font-bold tracking-wide text-brand-navy">{{ dateTitle }}</h2>
            <span class="text-sm text-brand-gray">{{ weekdayLabel }}</span>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95"
          >
            ⨉
          </button>
        </div>

        <!-- 當日事項清單 -->
        <div class="flex min-h-0 flex-col gap-5 overflow-y-auto pr-4 md:pr-6">
          <!-- 空狀態 -->
          <div
            v-if="!events || events.length === 0"
            class="flex flex-col items-center gap-3 py-12 text-center"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <img src="@/assets/icons/calendar.svg" alt="" class="h-6 w-6" />
            </div>
            <p class="text-sm text-gray-400">今天還沒有行程，點擊下方按鈕新增。</p>
          </div>

          <!-- 事項卡片 -->
          <div
            v-for="event in events"
            :key="event.id"
            class="relative rounded-2xl border border-gray-100 bg-white p-4 pl-6 shadow-sm"
          >
            <!-- 左側色條 -->
            <span
              class="absolute left-2.5 top-4 bottom-4 w-1 rounded-full"
              :style="{ backgroundColor: barColor(event) }"
            ></span>

            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <!-- 類型 chip + 標題 -->
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                    :class="tagStyle(event)"
                  >
                    {{ tagLabel(event) }}
                  </span>
                  <span class="text-base font-bold text-brand-navy">{{ event.title }}</span>
                </div>

                <!-- 內容列：寵物 / 時間 / 地點 / 備註 -->
                <div class="mt-3 flex flex-col gap-1.5 text-sm">
                  <div class="flex gap-4">
                    <span class="w-8 shrink-0 text-brand-gray">寵物</span>
                    <span class="text-brand-darkgray">{{ petNameOf(event) }}</span>
                  </div>
                  <div v-if="event.eventTime" class="flex gap-4">
                    <span class="w-8 shrink-0 text-brand-gray">時間</span>
                    <span class="text-brand-darkgray">{{ event.eventTime }}</span>
                  </div>
                  <div v-if="event.location" class="flex gap-4">
                    <span class="w-8 shrink-0 text-brand-gray">地點</span>
                    <span class="text-brand-darkgray">{{ event.location }}</span>
                  </div>
                  <div v-if="event.notes" class="flex gap-4">
                    <span class="w-8 shrink-0 text-brand-gray">備註</span>
                    <span class="text-brand-darkgray">{{ event.notes }}</span>
                  </div>
                </div>

                <!-- Google 同步失敗提示 -->
                <div v-if="event.googleSyncFailed" class="mt-3 flex items-center gap-2">
                  <span
                    class="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-600 whitespace-nowrap"
                  >
                    未同步
                  </span>
                  <button
                    @click="emit('resync', event)"
                    class="text-xs text-gray-400 underline hover:text-brand-orange transition-colors cursor-pointer"
                    type="button"
                  >
                    重新同步
                  </button>
                </div>
              </div>

              <!-- 編輯／刪除按鈕 -->
              <div class="flex flex-col gap-2 shrink-0">
                <button
                  @click="emit('edit', event)"
                  class="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-slate-100 hover:text-blue-500"
                  aria-label="編輯"
                >
                  <img src="@/assets/icons/edit-icon.svg" alt="編輯" class="h-4 w-4" />
                </button>
                <button
                  @click="emit('delete', event)"
                  class="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                  aria-label="刪除"
                >
                  <img src="@/assets/icons/delete-icon.svg" alt="刪除" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部：新增代辦事項 -->
        <div class="pr-4 md:pr-6">
          <button
            type="button"
            @click="handleAdd"
            class="w-full cursor-pointer rounded-xl bg-brand-blue py-3 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition duration-200 hover:bg-[#7b94ee] hover:shadow-lg active:scale-95"
          >
            ＋ 新增寵物行程
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 淡入淡出動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-card,
.fade-leave-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-enter-from .modal-card,
.fade-leave-to .modal-card {
  transform: scale(0.95);
}
</style>
