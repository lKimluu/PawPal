<script setup>
import { computed } from 'vue'
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '@/constants/legalContent.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  type: { type: String, default: 'privacy' },
})

defineEmits(['close'])

const modalData = computed(() => {
  return props.type === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <div
          class="modal-card relative flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white pb-6 pl-6 pr-2 shadow-2xl md:pb-8 md:pl-8 md:pr-3"
        >
          <div
            class="sticky top-0 z-10 flex items-center justify-between bg-white/95 py-5 pr-4 backdrop-blur-sm border-b border-slate-100 md:py-6 md:pr-5 mb-2"
          >
            <h2 class="text-xl font-bold tracking-wide text-brand-navy md:text-2xl">
              {{ modalData.title }}
            </h2>
            <button
              type="button"
              @click="$emit('close')"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-xl text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
            >
              ⨉
            </button>
          </div>
          <div
            class="flex min-h-0 flex-1 flex-col overflow-y-auto pr-4 text-sm leading-relaxed text-brand-darkgray whitespace-pre-line md:pr-5"
          >
            {{ modalData.content }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
