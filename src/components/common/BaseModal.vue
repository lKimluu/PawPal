<script setup>
import { ref } from 'vue'

// 外部控制 Props：控制彈窗標題與顯示狀態
defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: '建立新檔案' },
  subtitle: { type: String, default: '請依序填寫以下欄位資訊' },
  titleContentClass: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

// 按鈕群
const MOCK_TYPES = ['選項一', '選項二', '選項三']

// 表單綁定的動態資料模型範本
const form = ref({
  title: '',
  record_date: new Date(), // 🌟 與 V-Calendar 連接的 Date 物件
  other_info: '',
  selected_type: '選項一',
  description: '',
  files: [],
})

const fileInputRef = ref(null)

// 關閉與提交的核心事件傳遞
const handleClose = () => emit('close')
const handleSubmit = () => emit('submit', { ...form.value })

// 檔案上傳處理
const triggerFileInput = () => fileInputRef.value?.click()
const handleFileChange = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  console.log(`成功選取 ${files.length} 個檔案`, files)
}
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
          <div class="flex flex-col gap-1" :class="titleContentClass">
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

        <slot>
          <!-- 內部主要表單 -->
          <form
            @submit.prevent="handleSubmit"
            class="flex min-h-0 flex-col gap-5 overflow-y-auto pr-4 md:pr-6"
          >
          <!-- 單行文字輸入框(如：標題、姓名) -->
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">
              欄位名稱 (必填範例)
              <span class="text-red-600 font-normal">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="請輸入文字內容..."
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
              required
            />
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-[4.5fr_7.5fr]">
            <!-- 左半欄：V-Calendar 月曆日期選擇器 -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                選擇日期
                <!-- 必填紅色米字號 -->
                <span class="text-red-600 font-normal">*</span>
              </label>
              <VDatePicker
                v-model="form.record_date"
                :masks="{ input: 'YYYY-MM-DD' }"
                color="orange"
                class="brand-calendar"
                :popover="{ visibility: 'click', placement: 'bottom-start' }"
              >
                <template #default="{ inputValue, inputEvents }">
                  <div class="relative">
                    <input
                      :value="inputValue"
                      v-on="inputEvents"
                      placeholder="請選擇日期..."
                      class="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
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

            <!-- 右半欄：標準選填輸入框 (如：醫院名稱、地點) -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-bold text-brand-navy">
                一般並排欄位
                <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
              </label>
              <input
                v-model="form.other_info"
                type="text"
                placeholder="請輸入附屬文字..."
                class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
              />
            </div>
          </div>

          <!-- 單選切換按鈕群(如：醫療類型) -->
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">
              分類單選按鈕群
              <span class="text-red-600 font-normal">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                v-for="type in MOCK_TYPES"
                :key="type"
                type="button"
                @click="form.selected_type = type"
                :class="[
                  'cursor-pointer flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition duration-200 active:scale-95 border-2',
                  form.selected_type === type
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-navy shadow-sm shadow-brand-blue/20'
                    : 'border-slate-200 bg-brand-white text-brand-darkgray hover:border-brand-blue hover:bg-brand-blue/5 hover:text-brand-navy',
                ]"
              >
                <span
                  :class="[
                    'h-2 w-2 rounded-full transition duration-200',
                    form.selected_type === type
                      ? {
                          選項一: 'bg-[#92a8f5]',
                          選項二: 'bg-[#ffa002]',
                          選項三: 'bg-[#dd7e6b]',
                        }[type] || 'bg-brand-blue'
                      : 'bg-slate-300',
                  ]"
                ></span>
                {{ type }}
              </button>
            </div>
          </div>

          <!-- 多行大型文字區塊(如：描述) -->
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">
              多行描述文字區
              <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
            </label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="請輸入更詳細的補充描述或注意事項..."
              class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
            ></textarea>
          </div>

          <!-- 檔案/照片上傳拖曳大區塊 -->
          <div class="flex flex-col gap-2">
            <label class="text-base font-bold text-brand-navy">
              照片/檔案上傳
              <span class="text-xs font-normal text-brand-gray/50">（選填）</span>
            </label>
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

          <!-- 底部操作按鈕 (取消、確認送出) -->
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
              class="cursor-pointer rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition duration-200 hover:bg-[#7b94ee] hover:shadow-lg active:scale-95"
            >
              確認送出
            </button>
          </div>
          </form>
        </slot>
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
