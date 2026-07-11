import { ref } from 'vue'
import { defineStore } from 'pinia'

const MOCK_REPLY_DELAY = 800

const MOCK_REPLIES = [
  '毛孩的飲食建議定時定量，避免給予人類食物中過鹹或過甜的部分，才能維持腸胃健康喔！',
  '每天適度的運動和玩耍，有助於毛孩紓解壓力、維持理想體態。',
  '幫毛孩定期梳毛可以減少掉毛與打結，也是很好的互動時間。',
  '如果毛孩出現異常行為或不適超過一天，建議盡快帶去給獸醫師檢查。',
]

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

    await new Promise((resolve) => setTimeout(resolve, MOCK_REPLY_DELAY))

    const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
    addMessage('assistant', reply)
    isLoading.value = false
  }

  return {
    messages,
    isLoading,
    errorMessage,
    sendMessage,
  }
})
