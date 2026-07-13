import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useCalendarStore } from '@/stores/calendar.js'
import { useGrowthStore } from '@/stores/growth.js'
import { useMedicalStore } from '@/stores/medical.js'
import { usePetStore } from '@/stores/petStore.js'

export const useSessionStore = defineStore('session', () => {
  const authStore = useAuthStore()
  const calendarStore = useCalendarStore()
  const growthStore = useGrowthStore()
  const medicalStore = useMedicalStore()
  const petStore = usePetStore()

  function resetSessionStores() {
    medicalStore.reset()
    growthStore.reset()
    petStore.reset()
    calendarStore.reset()
  }

  async function login(email, password) {
    const result = await authStore.login(email, password)

    if (result.success) {
      resetSessionStores()
    }

    return result
  }

  function logout() {
    resetSessionStores()
    authStore.logout()
  }

  return {
    login,
    logout,
    resetSessionStores,
  }
})
