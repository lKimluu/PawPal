import { ref } from 'vue'
import { defineStore } from 'pinia'
import { sendAiAssistantMessage } from '@/api/ai.js'

export const useAiAssistantStore = defineStore('aiAssistant', () => {
  const messages = ref([])
  const isLoading = ref(false)
  const errorMessage = ref('')

  function addMessage(role, text) {
    messages.value.push({
      id: `${Date.now()}-${Math.random()}`,
      role,
      text,
      createdAt: new Date().toISOString(),
    })
  }

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || isLoading.value) return

    errorMessage.value = ''
    addMessage('user', trimmed)
    isLoading.value = true

    const result = await sendAiAssistantMessage(trimmed)

    if (result.success) {
      addMessage('assistant', result.reply)
    } else {
      errorMessage.value = result.message
    }

    isLoading.value = false
  }

  return {
    messages,
    isLoading,
    errorMessage,
    sendMessage,
  }
})
