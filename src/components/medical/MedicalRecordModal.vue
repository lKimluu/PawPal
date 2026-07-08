<script setup>
import { ref, computed, watch } from 'vue'

const RECORD_TYPES = ['看診', '疫苗', '手術', '用藥', '體檢', '其他']

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const isEditMode = computed(() => !!props.initialData)

const createDefaultForm = () => ({
  title: '',
  recordType: '看診',
  recordDate: new Date(),
  hospitalName: '',
  symptoms: '',
  diagnosis: '',
  prescription: '',
  imageUrl: [],
  rawFiles: [],
})

const form = ref(createDefaultForm())
const fileInputRef = ref(null)

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      if (props.initialData) {
        form.value = {
          ...createDefaultForm(),
          ...props.initialData,
          recordDate: props.initialData.recordDate
            ? new Date(props.initialData.recordDate)
            : createDefaultForm().recordDate,
        }
      } else {
        form.value = createDefaultForm()
      }
    }
  },
)

const handleClose = () => emit('close')

const handleSubmit = async () => {
  const remainingOldUrls = Array.isArray(form.value.imageUrl)
    ? form.value.imageUrl.filter((url) => typeof url === 'string' && url.startsWith('http'))
    : []

  const dateObj =
    form.value.recordDate instanceof Date ? form.value.recordDate : new Date(form.value.recordDate)
  const formattedDate = isNaN(dateObj.getTime())
    ? new Date().toISOString().split('T')[0]
    : new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0]

  emit('submit', {
    mode: isEditMode.value ? 'edit' : 'create',
    data: {
      ...form.value,
      imageUrl: remainingOldUrls,
      rawFiles: form.value.rawFiles,
      recordDate: formattedDate,
    },
  })
}

const triggerFileInput = () => fileInputRef.value?.click()

const handleFileChange = (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  files.forEach((file) => {
    const previewUrl = URL.createObjectURL(file)
    form.value.rawFiles.push(file)
    form.value.imageUrl.push(previewUrl)
  })

  if (fileInputRef.value) fileInputRef.value.value = ''
}

const removeImage = (index) => {
  const removedUrl = form.value.imageUrl[index]
  if (removedUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(removedUrl)
    const blobIndex = form.value.imageUrl
      .slice(0, index + 1)
      .filter((url) => typeof url === 'string' && url.startsWith('blob:')).length - 1
    if (blobIndex >= 0) {
      form.value.rawFiles.splice(blobIndex, 1)
    }
  }
  form.value.imageUrl.splice(index, 1)
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
        class="modal-card relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-6 md:p-8 transform duration-300 scale-100"
      >
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1 pr-4 md:pr-6">
            <h2 class="text-2xl font-bold tracking-wide text-brand-navy">
              {{ isEditMode ? '編輯醫療紀錄' : '新增醫療紀錄' }}
            </h2>
            <span class="text-xs text-brand-gray pt-1">{{
              isEditMode ? '修改您的紀錄資料' : '為您的寵物建立新的醫療紀錄'
            }}</span>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="flex h-8 w-8 text-lg items-center justify-center cursor-pointer rounded-full bg-slate-100 text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95"
          >
            ⨉
          </button>
        </div>

        <form
          @submit.prevent="handleSubmit"
          class="flex min-h-0 flex-col gap-5 overflow-y-auto pr-4 md:pr-6"
        >
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy"
              >標題 <span class="text-red-600 font-normal">*</span></label
            >
            <input
              v-model="form.title"
              type="text"
              placeholder="請輸入醫療紀錄標題（必填）"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-brand-white focus:ring-4 focus:ring-brand-blue/10"
              required
            />
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-[4.5fr_7.5fr]">
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy"
                >就診日期 <span class="text-red-600 font-normal">*</span></label
              >
              <VDatePicker
                v-model="form.recordDate"
                :masks="{ input: 'YYYY-MM-DD' }"
                color="orange"
                :popover="{ visibility: 'click', placement: 'bottom-start' }"
              >
                <template #default="{ inputValue, inputEvents }">
                  <div class="relative">
                    <input
                      :value="inputValue"
                      v-on="inputEvents"
                      placeholder="請選擇就診日期"
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
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy"
                >醫院名稱
                <span class="text-xs font-normal text-brand-gray/50">（選填）</span></label
              >
              <input
                v-model="form.hospitalName"
                type="text"
                placeholder="請輸入醫療院所名稱"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
              />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy"
              >醫療類型 <span class="text-red-600 font-normal">*</span></label
            >
            <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                v-for="type in RECORD_TYPES"
                :key="type"
                type="button"
                @click="form.recordType = type"
                :class="[
                  'cursor-pointer flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition duration-200 active:scale-95 border-2',
                  form.recordType === type
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-navy shadow-sm shadow-brand-blue/20'
                    : 'border-slate-200 bg-brand-white text-brand-darkgray hover:border-brand-blue hover:bg-brand-blue/5 hover:text-brand-navy',
                ]"
              >
                <span
                  :class="[
                    'h-2 w-2 rounded-full transition duration-200',
                    form.recordType === type
                      ? {
                          看診: 'bg-[#92a8f5]',
                          疫苗: 'bg-[#ffa002]',
                          手術: 'bg-[#dd7e6b]',
                          用藥: 'bg-[#74ef7e]',
                          體檢: 'bg-[#d2a8ff]',
                          其他: 'bg-[#ffa7e2]',
                        }[type]
                      : 'bg-slate-300',
                  ]"
                ></span>
                {{ type }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy"
              >狀況描述 <span class="text-xs font-normal text-brand-gray/50">（選填）</span></label
            >
            <textarea
              v-model="form.symptoms"
              rows="2"
              placeholder="請輸入寵物當時的病況、症狀描述..."
              class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
            ></textarea>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy"
              >診斷結果 <span class="text-xs font-normal text-brand-gray/50">（選填）</span></label
            >
            <textarea
              v-model="form.diagnosis"
              rows="2"
              placeholder="請輸入獸醫師的專業診斷（如：輕微腸胃炎）..."
              class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
            ></textarea>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy"
              >處方 <span class="text-xs font-normal text-brand-gray/50">（選填）</span></label
            >
            <textarea
              v-model="form.prescription"
              rows="2"
              placeholder="請輸入獸醫師開立的處方內容、用藥指導或注意事項..."
              class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
            ></textarea>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy"
              >照片上傳 <span class="text-xs font-normal text-brand-gray/50">（選填）</span></label
            >
            <input
              ref="fileInputRef"
              type="file"
              multiple
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <div
              @click="triggerFileInput"
              class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-blue/30 bg-brand-blue/5 py-5 transition duration-200 hover:border-brand-blue hover:bg-brand-blue/10"
            >
              <div class="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <img
                  class="h-5 w-5 object-contain"
                  src="@/assets/icons/paper-clip.svg"
                  alt="上傳圖標"
                />
                <span>上傳或拖曳看診照片、報告、藥單...</span>
              </div>
            </div>
          </div>
          <div
            v-if="form.imageUrl && form.imageUrl.length > 0"
            class="mt-3 grid grid-cols-3 md:grid-cols-5 gap-3"
          >
            <div
              v-for="(url, index) in form.imageUrl"
              :key="url"
              class="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 md:h-24 md:w-24"
            >
              <img :src="url" alt="預覽照片" class="h-full w-full object-cover" />
              <button
                type="button"
                @click.stop="removeImage(index)"
                class="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white transition duration-200 hover:bg-[#eb5656] active:scale-95"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="handleClose"
              class="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-95"
            >
              取消
            </button>
            <button
              type="submit"
              class="cursor-pointer rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition duration-200 hover:bg-[#7F97EC] hover:shadow-lg active:scale-95"
            >
              {{ isEditMode ? '儲存變更' : '新增紀錄' }}
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
