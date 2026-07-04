<script setup>
import { ref, watch, computed } from 'vue'
import { usePetStore } from '@/stores/petStore'
import TimeWheelPicker from '@/components/common/TimeWheelPicker.vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: '新增寵物行程' },
  subtitle: { type: String, default: '' },
  selectedDate: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const { pets } = usePetStore()

const EVENT_TYPES = [
  { label: '看診', color: '#ef6b6b' },
  { label: '疫苗', color: '#67c483' },
  { label: '美容', color: '#a78bfa' },
  { label: '餵藥', color: '#ffa002' },
  { label: '洗澡', color: '#60a5fa' },
  { label: '訓練', color: '#2dd4bf' },
  { label: '其他', color: '#94a3b8' },
]

const form = ref({
  title: '',
  petId: '',
  date: props.selectedDate || '',
  time: '',
  location: '',
  type: '看診',
  notes: '',
})

watch(
  () => props.selectedDate,
  (val) => {
    form.value.date = val || ''
  },
)

// 將 YYYY-MM-DD 轉換為顯示用的 YYYY / MM / DD
const displayDate = computed(() => {
  if (!form.value.date) return ''
  const [y, m, d] = form.value.date.split('-')
  return `${y} / ${m} / ${d}`
})

const resetForm = () => {
  form.value = {
    title: '',
    petId: '',
    date: props.selectedDate || '',
    time: '',
    location: '',
    type: '看診',
    notes: '',
  }
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = () => {
  emit('submit', { ...form.value })
  resetForm()
}
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
        <!-- 頂部標頭 -->
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <h2 class="text-2xl font-bold tracking-wide text-brand-navy">{{ title }}</h2>
            <span v-if="subtitle" class="pt-1 text-xs text-brand-gray">{{ subtitle }}</span>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95"
          >
            ⨉
          </button>
        </div>

        <!-- 表單 -->
        <form
          @submit.prevent="handleSubmit"
          class="flex min-h-0 flex-col gap-5 overflow-y-auto pr-4 md:pr-6"
        >
          <!-- Row 1：標題 + 寵物 -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- 標題 -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                標題 <span class="font-normal text-red-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                placeholder="請輸入行程標題"
                required
                class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
              />
            </div>

            <!-- 寵物 -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                寵物 <span class="font-normal text-red-500">*</span>
              </label>
              <div class="relative">
                <select
                  v-model="form.petId"
                  required
                  class="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                  :class="form.petId === '' ? 'text-brand-gray/40' : ''"
                >
                  <option value="" class="text-brand-gray/40">請選擇寵物</option>
                  <option v-for="pet in pets" :key="pet.id" :value="pet.id">{{ pet.name }}</option>
                </select>
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                  >▼</span
                >
              </div>
            </div>
          </div>

          <!-- Row 2：日期 + 時間 -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- 日期 -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                日期 <span class="font-normal text-red-500">*</span>
              </label>
              <VDatePicker
                v-model.string="form.date"
                :masks="{ modelValue: 'YYYY-MM-DD', input: 'YYYY / MM / DD' }"
                color="blue"
                :popover="{ visibility: 'click', placement: 'bottom-start' }"
              >
                <template #default="{ inputValue, inputEvents }">
                  <div class="relative">
                    <input
                      :value="inputValue"
                      v-on="inputEvents"
                      placeholder="YYYY / MM / DD"
                      readonly
                      class="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                    />
                    <span
                      class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                      >▼</span
                    >
                  </div>
                </template>
              </VDatePicker>
            </div>

            <!-- 時間 -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                時間 <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
              </label>
              <TimeWheelPicker v-model="form.time" />
            </div>
          </div>

          <!-- Row 3：地點 -->
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">
              地點 <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
            </label>
            <input
              v-model="form.location"
              type="text"
              placeholder="請輸入行程地點"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
            />
          </div>

          <!-- Row 4：類型 chips -->
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">
              類型 <span class="font-normal text-red-500">*</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="et in EVENT_TYPES"
                :key="et.label"
                type="button"
                @click="form.type = et.label"
                :style="
                  form.type === et.label
                    ? { borderColor: et.color, backgroundColor: et.color + '1a' }
                    : {}
                "
                class="flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 py-2 text-xs font-bold transition duration-200 active:scale-95"
                :class="
                  form.type === et.label
                    ? 'text-brand-navy shadow-sm'
                    : 'border-slate-200 bg-white text-brand-darkgray hover:border-brand-blue hover:bg-brand-blue/5 hover:text-brand-navy'
                "
              >
                <span
                  class="h-2 w-2 rounded-full transition duration-200"
                  :style="{ backgroundColor: form.type === et.label ? et.color : '#cbd5e1' }"
                ></span>
                {{ et.label }}
              </button>
            </div>
          </div>

          <!-- Row 5：備註 -->
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">
              備註 <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
            </label>
            <textarea
              v-model="form.notes"
              rows="3"
              placeholder="請輸入備註內容"
              class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
            ></textarea>
          </div>

          <!-- 底部按鈕 -->
          <div class="mt-2 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              @click="handleClose"
              class="cursor-pointer rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-500 transition duration-200 hover:bg-slate-50 hover:text-slate-700 active:scale-95"
            >
              取消
            </button>
            <button
              type="submit"
              class="cursor-pointer rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition duration-200 hover:bg-[#7b94ee] hover:shadow-lg active:scale-95"
            >
              新增
            </button>
          </div>
        </form>
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
