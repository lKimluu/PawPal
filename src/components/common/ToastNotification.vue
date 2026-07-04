<script setup>
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
</script>

<template>
  <div
    class="fixed top-16 left-0 right-0 z-50 flex-col gap-2.5 pointer-events-none grid justify-items-center px-4 md:top-20"
  >
    <TransitionGroup name="toast-list">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-1.5 rounded-full border px-4 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.04)] bg-white max-w-[85vw] md:gap-2 md:px-6 md:py-2 md:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        :class="{
          'border-green-200 text-green-800': toast.type === 'success',
          'border-red-200 text-[#eb5656]': toast.type === 'error',
        }"
        :style="{
          backgroundColor: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
        }"
      >
        <span
          class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-brand-white md:h-5 md:w-5 md:text-xs"
          :class="{
            'bg-green-500': toast.type === 'success',
            'bg-[#eb5656]': toast.type === 'error',
          }"
        >
          {{ toast.type === 'success' ? '✓' : '✕' }}
        </span>
        <span class="text-[11px] font-bold tracking-wider md:text-sm">
          {{ toast.message }}
        </span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-list-leave-to {
  opacity: 0;
}

.toast-list-leave-active {
  position: absolute;
  white-space: nowrap;
}

.toast-list-move {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
</style>
