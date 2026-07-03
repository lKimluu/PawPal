<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: '新增成長指標' },
  subtitle: { type: String, default: '記錄毛孩的各項指標' },
})

const emit = defineEmits(['close', 'submit'])

const form = ref({
  record_date: new Date(),
  weight: '',
  length: '',
  food_intake: '',
  water_frequency: '',
  urination: '',
  defecation: '',
})

const hasAtLeastOne = computed(
  () =>
    form.value.weight !== '' ||
    form.value.length !== '' ||
    form.value.food_intake !== '' ||
    form.value.water_frequency !== '' ||
    form.value.urination !== '' ||
    form.value.defecation !== '',
)

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      form.value = {
        record_date: new Date(),
        weight: '',
        length: '',
        food_intake: '',
        water_frequency: '',
        urination: '',
        defecation: '',
      }
    }
  },
)

const handleClose = () => emit('close')

const handleSubmit = () => {
  let formattedDate = ''
  if (form.value.record_date instanceof Date) {
    const y = form.value.record_date.getFullYear()
    const m = String(form.value.record_date.getMonth() + 1).padStart(2, '0')
    const d = String(form.value.record_date.getDate()).padStart(2, '0')
    formattedDate = `${y}-${m}-${d}`
  } else {
    formattedDate = form.value.record_date.substring(0, 10)
  }

  emit('submit', {
    record_date: formattedDate,
    weight: form.value.weight !== '' ? Number(form.value.weight) : null,
    length: form.value.length !== '' ? Number(form.value.length) : null,
    food_intake: form.value.food_intake !== '' ? Number(form.value.food_intake) : null,
    water_frequency: form.value.water_frequency !== '' ? Number(form.value.water_frequency) : null,
    urination: form.value.urination !== '' ? Number(form.value.urination) : null,
    defecation: form.value.defecation !== '' ? Number(form.value.defecation) : null,
  })
  handleClose()
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
        class="modal-card flex max-h-[90vh] w-full max-w-lg flex-col gap-6 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
      >
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <h2 class="text-2xl font-bold tracking-wide text-brand-navy">{{ title }}</h2>
            <span v-if="subtitle" class="text-xs text-brand-gray pt-1">{{ subtitle }}</span>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95"
          >
            ⨉
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">
              記錄日期
              <span class="text-red-600 font-normal">*</span>
            </label>
            <VDatePicker
              v-model="form.record_date"
              :masks="{ input: 'YYYY-MM-DD' }"
              color="orange"
              :popover="{ visibility: 'click', placement: 'bottom-start' }"
            >
              <template #default="{ inputValue, inputEvents }">
                <div class="relative">
                  <input
                    :value="inputValue"
                    v-on="inputEvents"
                    placeholder="請選擇記錄日期"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10 cursor-pointer"
                    readonly
                  />
                  <span
                    class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray text-xs"
                    >▼</span
                  >
                </div>
              </template>
            </VDatePicker>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                體重
                <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.weight"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="例：5.2"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                />
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                  >kg</span
                >
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                身體長度
                <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.length"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="例：45"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                />
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                  >cm</span
                >
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                進食量
                <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.food_intake"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="例：120"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                />
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                  >g</span
                >
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                飲水次數
                <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.water_frequency"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="例：4"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                />
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                  >次</span
                >
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                排尿次數
                <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.urination"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="例：3"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                />
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                  >次</span
                >
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                排便次數
                <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.defecation"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="例：1"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                />
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-gray"
                  >次</span
                >
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              @click="handleClose"
              class="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-95"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="!hasAtLeastOne"
              :class="[
                'rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition duration-200',
                hasAtLeastOne
                  ? 'cursor-pointer bg-brand-orange shadow-brand-orange/20 hover:bg-[#ee9300] hover:shadow-lg active:scale-95'
                  : 'cursor-not-allowed bg-slate-300 shadow-none',
              ]"
            >
              新增紀錄
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
