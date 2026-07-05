<script setup>
import { reactive, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'submit'])

const validationError = ref('')

const form = reactive({
  name: '',
  species: '',
  breed: '',
  gender: '',
  birthday: '',
  weight: '',
  microchipNumber: '',
  neutered: false,
  bloodType: '',
  furColor: '',
  photoUrl: '',
  note: '',
})

function resetForm() {
  Object.assign(form, {
    name: '',
    species: '',
    breed: '',
    gender: '',
    birthday: '',
    weight: '',
    microchipNumber: '',
    neutered: false,
    bloodType: '',
    furColor: '',
    photoUrl: '',
    note: '',
  })
  validationError.value = ''
}

function handleClose() {
  if (!props.isLoading) {
    emit('close')
  }
}

function handleSubmit() {
  validationError.value = ''

  if (!form.name.trim()) {
    validationError.value = '請填寫寵物名稱'
    return
  }

  if (!form.species.trim()) {
    validationError.value = '請填寫物種'
    return
  }

  if (form.weight !== '' && Number(form.weight) < 0) {
    validationError.value = '體重不可小於 0'
    return
  }

  emit('submit', { ...form })
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
    }
  },
)
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <section
        class="modal-card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white p-6 text-brand-navy shadow-2xl md:p-8"
      >
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold tracking-wide">新增寵物</h2>
            <p class="mt-1 text-sm text-brand-gray">建立寵物基本資料</p>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition hover:bg-brand-blue/20 hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="關閉"
            :disabled="isLoading"
            @click="handleClose"
          >
            x
          </button>
        </div>

        <form class="min-h-0 overflow-y-auto pr-1" @submit.prevent="handleSubmit">
          <p
            v-if="validationError || errorMessage"
            class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          >
            {{ validationError || errorMessage }}
          </p>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="flex flex-col gap-2 text-sm font-bold">
              寵物名稱 <span class="sr-only">必填</span>
              <input
                v-model="form.name"
                type="text"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                placeholder="例如：Momo"
                :disabled="isLoading"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              物種 <span class="sr-only">必填</span>
              <input
                v-model="form.species"
                type="text"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                placeholder="例如：狗、貓"
                :disabled="isLoading"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              品種
              <input
                v-model="form.breed"
                type="text"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                placeholder="例如：柴犬"
                :disabled="isLoading"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              性別
              <select
                v-model="form.gender"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                :disabled="isLoading"
              >
                <option value="">未填寫</option>
                <option value="male">男生</option>
                <option value="female">女生</option>
              </select>
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              生日
              <input
                v-model="form.birthday"
                type="date"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                :disabled="isLoading"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              體重
              <input
                v-model="form.weight"
                type="number"
                min="0"
                step="0.1"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                placeholder="kg"
                :disabled="isLoading"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              晶片號碼
              <input
                v-model="form.microchipNumber"
                type="text"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                :disabled="isLoading"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              血型
              <input
                v-model="form.bloodType"
                type="text"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                :disabled="isLoading"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              毛色
              <input
                v-model="form.furColor"
                type="text"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                :disabled="isLoading"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-bold">
              照片網址
              <input
                v-model="form.photoUrl"
                type="url"
                class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                placeholder="https://..."
                :disabled="isLoading"
              />
            </label>
          </div>

          <label class="mt-4 flex flex-col gap-2 text-sm font-bold">
            備註
            <textarea
              v-model="form.note"
              rows="3"
              class="resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
              :disabled="isLoading"
            ></textarea>
          </label>

          <label class="mt-4 flex items-center gap-3 text-sm font-bold">
            <input
              v-model="form.neutered"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
              :disabled="isLoading"
            />
            已結紮
          </label>

          <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <BaseButton type="button" variant="secondary" :disabled="isLoading" @click="handleClose">
              取消
            </BaseButton>
            <BaseButton type="submit" :disabled="isLoading">
              {{ isLoading ? '送出中...' : '新增' }}
            </BaseButton>
          </div>
        </form>
      </section>
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
