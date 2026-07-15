<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
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

const listRef = ref(null)

watch(
  () => [props.messages.length, props.isLoading],
  async () => {
    await nextTick()
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  },
)
</script>

<template>
  <div ref="listRef" class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-2">
    <div
      v-if="messages.length === 0 && !isLoading"
      class="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center"
    >
      <p class="text-sm font-medium text-brand-navy">嗨！我是 PawPal 寵物小助手</p>
      <p class="text-xs text-brand-gray">歡迎點選下方快速提問，或直接輸入您的問題</p>
    </div>

    <div
      v-for="message in messages"
      :key="message.id"
      class="flex"
      :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
    >
      <div
        class="max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed"
        :class="
          message.role === 'user' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-brand-darkgray'
        "
      >
        {{ message.text }}
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-start">
      <div class="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3">
        <span
          class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-gray [animation-delay:-0.3s]"
        ></span>
        <span
          class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-gray [animation-delay:-0.15s]"
        ></span>
        <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-gray"></span>
      </div>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
  </div>
</template>
