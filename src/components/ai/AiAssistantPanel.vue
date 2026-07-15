<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAiAssistantStore } from '@/stores/aiAssistant.js'
import AiAssistantMessageList from '@/components/ai/AiAssistantMessageList.vue'
import AiAssistantInput from '@/components/ai/AiAssistantInput.vue'

const aiAssistantStore = useAiAssistantStore()
const route = useRoute()
const isOpen = ref(false)

function togglePanel() {
  isOpen.value = !isOpen.value
}

function closePanel() {
  isOpen.value = false
}

function handleSend(text) {
  aiAssistantStore.sendMessage(text)
}

watch(
  () => route.fullPath,
  () => {
    closePanel()
  },
)
</script>

<template>
  <button
    v-if="!isOpen"
    type="button"
    class="fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-brand-blue text-white shadow-lg shadow-brand-blue/30 transition duration-200 hover:bg-[#7b94ee] hover:shadow-xl active:scale-95"
    aria-label="開啟 AI 寵物小助手"
    @click="togglePanel"
  >
    <img
      src="@/assets/images/PawPal_mark_w.webp"
      alt="開啟 AI 寵物小助手"
      class="h-12 w-12 object-contain"
    />
  </button>

  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed bottom-6 right-6 z-40 flex h-[520px] max-h-[calc(100vh-3rem)] w-[450px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
    >
      <div class="flex items-center justify-between rounded-t-3xl bg-brand-blue pl-5 pr-3 py-4">
        <p class="text-lg font-bold text-white">PawPal 寵物小助手</p>
        <button
          type="button"
          class="-mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/20 text-lg text-white transition duration-200 hover:bg-white/30 active:scale-95"
          aria-label="關閉"
          @click="closePanel"
        >
          ⨉
        </button>
      </div>

      <div class="bg-brand-orange/10 px-5 py-2.5">
        <p class="text-xs leading-relaxed text-brand-navy md:text-sm">
          <span class="font-semibold text-brand-orange">提醒您：</span
          >本功能僅提供寵物日常照護知識參考，非線上看診或醫療診斷，如毛孩有健康疑慮請諮詢獸醫師。
        </p>
      </div>

      <AiAssistantMessageList
        :messages="aiAssistantStore.messages"
        :is-loading="aiAssistantStore.isLoading"
        :error-message="aiAssistantStore.errorMessage"
      />

      <div class="px-4 pb-4">
        <AiAssistantInput :is-loading="aiAssistantStore.isLoading" @send="handleSend" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
