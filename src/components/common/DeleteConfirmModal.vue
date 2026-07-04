<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '確定刪除此項目？',
  },
  itemName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'confirm'])

const handleClose = () => emit('close')
const handleConfirm = () => emit('confirm')
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div
        class="modal-card relative flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-white p-6 text-center shadow-2xl md:p-8 transform duration-300 scale-100"
      >
        <button
          type="button"
          @click="handleClose"
          class="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95"
        >
          ⨉
        </button>
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mt-2">
          <img class="w-8 h-8" src="@/assets/icons/delete_r.svg" alt="刪除" />
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-2xl font-bold tracking-wide text-brand-navy">
            {{ title }}
          </h3>
          <p class="text-sm font-normal text-brand-gray leading-loose pt-1">
            刪除後將無法復原，<br />
            確定要刪除<span class="text-brand-navy font-bold">「{{ itemName }}」</span>嗎？
          </p>
        </div>
        <div class="mt-2 flex w-full gap-3">
          <button
            type="button"
            @click="handleConfirm"
            class="flex-1 cursor-pointer rounded-xl bg-[#eb5656] py-2.5 text-sm font-semibold text-brand-white shadow-md shadow-red-500/20 transition duration-200 hover:bg-red-500 hover:shadow-lg active:scale-95"
          >
            確定刪除
          </button>
          <button
            type="button"
            @click="handleClose"
            class="flex-1 cursor-pointer rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-brand-gray transition duration-200 hover:bg-brand-blue/10 hover:text-brand-navy active:scale-95"
          >
            取消
          </button>
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
