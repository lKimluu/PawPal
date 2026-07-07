import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getEvents,
  createEvent,
  updateEvent as updateEventApi,
  deleteEvent as deleteEventApi,
} from '@/api/calendar.js'
import { useAuthStore } from '@/stores/auth.js'

export const useCalendarStore = defineStore('calendar', () => {
  const authStore = useAuthStore()

  const events = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchEvents() {
    isLoading.value = true
    error.value = null
    try {
      const result = await getEvents(authStore.token)

      if (result.success) {
        events.value = result.data
      } else {
        error.value = result.message
      }

      return result
    } finally {
      isLoading.value = false
    }
  }

  async function addEvent(form) {
    isLoading.value = true
    error.value = null
    try {
      const result = await createEvent(form, authStore.token)

      if (result.success) {
        await fetchEvents()
      } else {
        error.value = result.message
      }

      return result
    } finally {
      isLoading.value = false
    }
  }

  async function updateEvent(id, form) {
    isLoading.value = true
    error.value = null
    try {
      const result = await updateEventApi(id, form, authStore.token)

      if (result.success) {
        await fetchEvents()
      } else {
        error.value = result.message
      }

      return result
    } finally {
      isLoading.value = false
    }
  }

  async function deleteEvent(id) {
    isLoading.value = true
    error.value = null
    try {
      const result = await deleteEventApi(id, authStore.token)

      if (result.success) {
        await fetchEvents()
      } else {
        error.value = result.message
      }

      return result
    } finally {
      isLoading.value = false
    }
  }

  return { events, isLoading, error, fetchEvents, addEvent, updateEvent, deleteEvent }
})
