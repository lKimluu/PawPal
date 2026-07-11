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
  }
})
