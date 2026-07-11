import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getGrowthRecords,
  createGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
} from '@/api/growth.js'

const UNIT_MAP = {
  weight: 'kg',
  length: 'cm',
  food_intake: 'g',
  water_frequency: '次',
  urination: '次',
  defecation: '次',
}

export const useGrowthStore = defineStore('growth', () => {
  const records = ref([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref(null)
  let requestGeneration = 0

  function isCurrentRequest(generation) {
    return generation === requestGeneration
  }

  async function fetchRecords(petId, token) {
    const generation = requestGeneration

    isLoading.value = true
    errorMessage.value = null

    const result = await getGrowthRecords(petId, token)
    if (!isCurrentRequest(generation)) {
      return { success: false, stale: true }
    }

    if (result.success) {
      records.value = result.data.records ?? []
    } else {
      errorMessage.value = result.message
    }

    if (isCurrentRequest(generation)) {
      isLoading.value = false
    }

    return result
  }

  async function createRecordsFrom(petId, formData, token) {
    const generation = requestGeneration

    isSubmitting.value = true
    errorMessage.value = null

    const { recordDate, ...metrics } = formData
    const entries = Object.entries(metrics).filter(([, value]) => value !== null)

    const results = await Promise.all(
      entries.map(([metric_type, value]) =>
        createGrowthRecord(
          {
            petId,
            metricType: metric_type,
            value,
            unit: UNIT_MAP[metric_type],
            recordedAt: recordDate,
          },
          token,
        ),
      ),
    )
    if (!isCurrentRequest(generation)) {
      return results.map(() => ({ success: false, stale: true }))
    }

    const failed = results.find((r) => !r.success)
    if (failed) {
      errorMessage.value = failed.message
    }

    if (isCurrentRequest(generation)) {
      isSubmitting.value = false
    }

    return results
  }

  async function updateRecord(id, value, token) {
    const generation = requestGeneration
    const result = await updateGrowthRecord(id, value, token)
    if (!isCurrentRequest(generation)) {
      return { success: false, stale: true }
    }

    if (result.success) {
      const index = records.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        records.value[index] = { ...records.value[index], value }
      }
    }
    return result
  }

  async function deleteRecord(id, token) {
    const generation = requestGeneration
    const result = await deleteGrowthRecord(id, token)
    if (!isCurrentRequest(generation)) {
      return { success: false, stale: true }
    }

    if (result.success) {
      records.value = records.value.filter((r) => r.id !== id)
    }
    return result
  }

  function reset() {
    requestGeneration += 1
    records.value = []
    isLoading.value = false
    isSubmitting.value = false
    errorMessage.value = null
  }

  return {
    records,
    isLoading,
    isSubmitting,
    errorMessage,
    fetchRecords,
    createRecordsFrom,
    updateRecord,
    deleteRecord,
    reset,
  }
})
