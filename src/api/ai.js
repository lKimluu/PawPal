import axios from 'axios'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''
const API_PREFIX = '/api/v1'

function getErrorMessage(error, fallbackMessage) {
  return error.response?.data?.message || error.message || fallbackMessage
}

export async function sendAiAssistantMessage(message) {
  try {
    const response = await axios.post(`${API_BASE_URL}${API_PREFIX}/ai-assistant`, { message })

    return {
      success: true,
      reply: response.data?.reply ?? '',
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, 'AI 小助手回覆失敗，請稍後再試'),
    }
  }
}
