import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  getEvents,
  createEvent,
  updateEvent as updateEventApi,
  deleteEvent as deleteEventApi,
  resyncEvent as resyncEventApi,
} from '@/api/calendar.js'
import { useAuthStore } from '@/stores/auth.js'
import { formatLocalDate } from '@/utils/dateFormat.js'

export const useCalendarStore = defineStore('calendar', () => {
  const authStore = useAuthStore()

  const events = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  let requestGeneration = 0

  // 'all' = 檢視全部；否則為某隻寵物的 id（number）
  const selectedPetId = ref('all')

  const filteredEvents = computed(() =>
    selectedPetId.value === 'all'
      ? events.value
      : events.value.filter((e) => e.petId === selectedPetId.value),
  )

  // 只顯示「今天起算三天內（含當天）」的行程，依日期由近到遠排序（同日再依時間）
  const upcomingEvents = computed(() => {
    const today = new Date()
    const startStr = formatLocalDate(today)
    const end = new Date(today)
    end.setDate(end.getDate() + 2)
    const endStr = formatLocalDate(end)
    return filteredEvents.value
      .filter((e) => e.eventDate >= startStr && e.eventDate <= endStr)
      .sort((a, b) =>
        (a.eventDate + (a.eventTime || '')).localeCompare(b.eventDate + (b.eventTime || '')),
      )
  })

  function setSelectedPet(id) {
    selectedPetId.value = id
  }

  function isCurrentRequest(generation) {
    return generation === requestGeneration
  }

  async function fetchEvents() {
    const generation = requestGeneration

    isLoading.value = true
    error.value = null
    try {
      const result = await getEvents(authStore.token)
      if (!isCurrentRequest(generation)) {
        return { success: false, stale: true }
      }

      if (result.success) {
        events.value = result.data
      } else {
        error.value = result.message
      }

      return result
    } finally {
      if (isCurrentRequest(generation)) {
        isLoading.value = false
      }
    }
  }

  async function addEvent(form) {
    const generation = requestGeneration

    isLoading.value = true
    error.value = null
    try {
      const result = await createEvent(form, authStore.token)
      if (!isCurrentRequest(generation)) {
        return { success: false, stale: true }
      }

      if (result.success) {
        await fetchEvents()
        if (!isCurrentRequest(generation)) {
          return { success: false, stale: true }
        }
      } else {
        error.value = result.message
      }

      return result
    } finally {
      if (isCurrentRequest(generation)) {
        isLoading.value = false
      }
    }
  }

  async function updateEvent(id, form) {
    const generation = requestGeneration

    isLoading.value = true
    error.value = null
    try {
      const result = await updateEventApi(id, form, authStore.token)
      if (!isCurrentRequest(generation)) {
        return { success: false, stale: true }
      }

      if (result.success) {
        await fetchEvents()
        if (!isCurrentRequest(generation)) {
          return { success: false, stale: true }
        }
      } else {
        error.value = result.message
      }

      return result
    } finally {
      if (isCurrentRequest(generation)) {
        isLoading.value = false
      }
    }
  }

  async function deleteEvent(id) {
    const generation = requestGeneration

    isLoading.value = true
    error.value = null
    try {
      const result = await deleteEventApi(id, authStore.token)
      if (!isCurrentRequest(generation)) {
        return { success: false, stale: true }
      }

      if (result.success) {
        await fetchEvents()
        if (!isCurrentRequest(generation)) {
          return { success: false, stale: true }
        }
      } else {
        error.value = result.message
      }

      return result
    } finally {
      if (isCurrentRequest(generation)) {
        isLoading.value = false
      }
    }
  }

  async function resyncEvent(id) {
    isLoading.value = true
    error.value = null
    try {
      const result = await resyncEventApi(id, authStore.token)

      if (result.success) {
        await fetchEvents()
      } else {
        error.value = result.message
      }

      return result
    } finally {
      isLoading.value = false
    }
  function reset() {
    requestGeneration += 1
    events.value = []
    isLoading.value = false
    error.value = null
    selectedPetId.value = 'all'
  }

  return {
    events,
    isLoading,
    error,
    selectedPetId,
    filteredEvents,
    upcomingEvents,
    setSelectedPet,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    resyncEvent,
    reset,
  }
})
