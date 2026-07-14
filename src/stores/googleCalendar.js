import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getGoogleCalendarStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
} from '@/api/googleCalendar.js'
import { useAuthStore } from '@/stores/auth.js'

export const useGoogleCalendarStore = defineStore('googleCalendar', () => {
  const authStore = useAuthStore()

  const isConnected = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchStatus() {
    isLoading.value = true
    error.value = null
    try {
      const result = await getGoogleCalendarStatus(authStore.token)

      if (result.success) {
        isConnected.value = Boolean(result.data?.connected)
      } else {
        error.value = result.message
      }

      return result
    } finally {
      isLoading.value = false
    }
  }

  async function connect(code) {
    isLoading.value = true
    error.value = null
    try {
      const result = await connectGoogleCalendar(code, authStore.token)

      if (result.success) {
        isConnected.value = true
      } else {
        error.value = result.message
      }

      return result
    } finally {
      isLoading.value = false
    }
  }

  async function disconnect() {
    isLoading.value = true
    error.value = null
    try {
      const result = await disconnectGoogleCalendar(authStore.token)

      if (result.success) {
        isConnected.value = false
      } else {
        error.value = result.message
      }

      return result
    } finally {
      isLoading.value = false
    }
  }

  return {
    isConnected,
    isLoading,
    error,
    fetchStatus,
    connect,
    disconnect,
  }
})
