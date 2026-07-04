import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getGrowthRecords, createGrowthRecord } from '@/api/growth.js'

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

  async function fetchRecords(petId, token) {
    isLoading.value = true
    errorMessage.value = null

    const result = await getGrowthRecords(petId, token)

    if (result.success) {
      records.value = result.data.data ?? []
    } else {
      errorMessage.value = result.message
    }

    isLoading.value = false
  }

  async function createRecordsFrom(petId, formData, token) {
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

    const failed = results.find((r) => !r.success)
    if (failed) {
      errorMessage.value = failed.message
    }

    isSubmitting.value = false

    return results
  }

  return {
    records,
    isLoading,
    isSubmitting,
    errorMessage,
    fetchRecords,
    createRecordsFrom,
  }
})
