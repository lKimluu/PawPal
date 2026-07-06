<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  records: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'edit-record', 'delete-record'])

const METRIC_LABEL_MAP = {
  weight: '體重',
  length: '身體長度',
  food_intake: '每日進食量',
  water_frequency: '飲水次數',
  urination: '排尿次數',
  defecation: '排便次數',
}

const METRIC_COLOR_MAP = {
  weight: '#ffa002',
  length: '#64748b',
  food_intake: '#10B981',
  water_frequency: '#92a8f5',
  urination: '#ff66cc',
  defecation: '#8B5CF6',
}

const tabs = ['全部', '體重', '身體長度', '每日進食量', '飲水次數', '排尿次數', '排便次數']
const activeTab = ref('全部')

const filteredRecords = computed(() => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const recent = props.records.filter((r) => new Date(r.recorded_at) >= cutoff)

  if (activeTab.value === '全部') return recent
  return recent.filter((r) => METRIC_LABEL_MAP[r.metric_type] === activeTab.value)
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.substring(0, 10).split('-')
  return `${y}-${m}-${d}`
}

const handleClose = () => emit('close')
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div
        class="modal-card relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-6 overflow-hidden rounded-3xl bg-white pt-6 pb-6 pl-6 pr-2 shadow-2xl md:pt-8 md:pb-8 md:pr-2 md:pl-8"
      >
        <div class="flex items-start justify-between pr-4 md:pr-6">
          <div class="flex items-baseline gap-2">
            <h2 class="text-2xl font-bold tracking-wide text-brand-navy">歷史紀錄</h2>
            <span class="text-sm text-brand-gray">僅顯示最近 30 天紀錄</span>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95"
          >
            ⨉
          </button>
        </div>

        <div class="flex gap-3 overflow-x-auto pb-1">
          <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            class="appearance-none flex items-center justify-center shrink-0 cursor-pointer rounded-full px-3 py-2 text-sm font-bold shadow-sm transition duration-200 active:scale-95"
            :class="
              activeTab === tab
                ? 'bg-brand-blue text-white shadow-brand-blue/20'
                : 'bg-slate-100 text-brand-gray hover:text-brand-blue'
            "
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-4 md:pr-6">
          <div
            v-if="filteredRecords.length === 0"
            class="flex flex-col items-center justify-center py-16 text-center"
          >
            <p class="text-sm text-brand-gray">目前沒有紀錄</p>
          </div>

          <div
            v-for="record in filteredRecords"
            :key="record.id"
            class="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
          >
            <!-- 手機版：兩排 -->
            <div class="md:hidden">
              <!-- 第一排：icon + 日期 -->
              <div class="flex items-center gap-1">
                <div
                  class="h-3 w-3 shrink-0 rounded-full"
                  :style="{ backgroundColor: METRIC_COLOR_MAP[record.metric_type] ?? '#cbd5e1' }"
                ></div>
                <span class="text-sm text-brand-gray">
                  {{ formatDate(record.recorded_at) }}
                </span>
              </div>
              <!-- 第二排：種類 + 數值 + 編輯刪除 -->
              <div class="mt-1 flex items-center pl-5">
                <span class="flex-1 text-sm font-medium text-brand-navy">
                  {{ METRIC_LABEL_MAP[record.metric_type] ?? record.metric_type }}
                </span>
                <span class="text-sm font-bold text-brand-darkgray mr-4">
                  {{ record.value }} {{ record.unit }}
                </span>
                <div class="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    @click="emit('edit-record', record)"
                    class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition hover:bg-brand-blue/15 active:scale-95"
                  >
                    <img class="h-4 w-4" src="@/assets/icons/edit_b.svg" alt="編輯" />
                  </button>
                  <button
                    type="button"
                    @click="emit('delete-record', record)"
                    class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition hover:bg-red-500/15 active:scale-95"
                  >
                    <img class="h-4 w-4" src="@/assets/icons/delete_r.svg" alt="刪除" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 桌機版：原本一排 -->
            <div class="hidden md:flex items-center gap-5">
              <div
                class="h-3 w-3 shrink-0 rounded-full"
                :style="{ backgroundColor: METRIC_COLOR_MAP[record.metric_type] ?? '#cbd5e1' }"
              ></div>
              <span class="w-24 shrink-0 text-sm text-brand-gray">
                {{ formatDate(record.recorded_at) }}
              </span>
              <span class="flex-1 text-sm font-medium text-brand-navy">
                {{ METRIC_LABEL_MAP[record.metric_type] ?? record.metric_type }}
              </span>
              <span class="shrink-0 text-sm font-bold text-brand-darkgray mr-6">
                {{ record.value }} {{ record.unit }}
              </span>
              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  @click="emit('edit-record', record)"
                  class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition hover:bg-brand-blue/15 active:scale-95"
                >
                  <img class="h-4 w-4" src="@/assets/icons/edit_b.svg" alt="編輯" />
                </button>
                <button
                  type="button"
                  @click="emit('delete-record', record)"
                  class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition hover:bg-red-500/15 active:scale-95"
                >
                  <img class="h-4 w-4" src="@/assets/icons/delete_r.svg" alt="刪除" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
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
