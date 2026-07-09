import { ref } from 'vue'
import { defineStore } from 'pinia'
import { medicalApi } from '@/api/medical.js'

export const useMedicalStore = defineStore('medical', () => {
  const records = ref([])
  const isLoading = ref(false)
  const errorMsg = ref('')

  function buildRecordPayload(petId, formData) {
    const payload = {
      pet_id: Number(petId),
      title: formData.title,
      record_type: formData.record_type || formData.recordType,
      record_date: formData.record_date || formData.recordDate,
      image_url: Array.isArray(formData.image_url)
        ? formData.image_url
        : Array.isArray(formData.imageUrl)
          ? formData.imageUrl.filter((url) => typeof url === 'string' && !url.startsWith('blob:'))
          : [],
      rawFiles: Array.isArray(formData.rawFiles) ? formData.rawFiles : [],
    }

    if (formData.hospital_name !== undefined) {
      payload.hospital_name = formData.hospital_name?.trim() || ''
    } else if (formData.hospitalName !== undefined) {
      payload.hospital_name = formData.hospitalName?.trim() || ''
    }

    if (formData.symptoms !== undefined) {
      payload.symptoms = formData.symptoms
    }

    if (formData.diagnosis !== undefined) {
      payload.diagnosis = formData.diagnosis
    }

    if (formData.prescription !== undefined) {
      payload.prescription = formData.prescription
    }

    return payload
  }

  async function fetchRecords(petId, recordType = '全部') {
    if (!petId) {
      records.value = []
      return
    }

    isLoading.value = true
    errorMsg.value = ''

    try {
      const response = await medicalApi.getRecordsByPet(petId, recordType)
      const serverRecords = response.data?.data || response.data || []

      records.value = Array.isArray(serverRecords)
        ? serverRecords.map((record) => {
            const rawDate = record.record_date || record.recordDate || ''
            const cleanDate = rawDate ? rawDate.substring(0, 10) : ''
            const imageUrl = Array.isArray(record.image_url)
              ? record.image_url
              : Array.isArray(record.imageUrl)
                ? record.imageUrl
                : []

            return {
              id: record.id,
              title: record.title || '未命名紀錄',
              recordType: record.record_type || record.recordType || '其他',
              recordDate: cleanDate,
              hospitalName: record.hospital_name || record.hospitalName || '',
              symptoms: record.symptoms || '',
              diagnosis: record.diagnosis || '',
              prescription: record.prescription || '',
              imageUrl,
            }
          })
        : []
    } catch (err) {
      console.error('Store 撈取醫療紀錄失敗:', err)
      errorMsg.value = err.response?.data?.message || '撈取醫療紀錄失敗，請稍後再試。'
      records.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function addRecord(petId, formData) {
    isLoading.value = true
    errorMsg.value = ''

    try {
      const payload = buildRecordPayload(petId, formData)
      const response = await medicalApi.createRecord(payload)

      if (response.status === 200 || response.status === 201) {
        await fetchRecords(petId)
        return { success: true }
      }

      return { success: false, message: '後端寫入異常' }
    } catch (err) {
      console.error('Store 新增醫療紀錄失敗:', err)
      const message = err.response?.data?.message || '資料格式驗證失敗'
      errorMsg.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  async function updateRecord(recordId, petId, formData) {
    isLoading.value = true
    errorMsg.value = ''

    try {
      const payload = buildRecordPayload(petId, formData)
      const response = await medicalApi.updateRecord(recordId, payload)

      if (response.status === 200) {
        await fetchRecords(petId)
        return { success: true }
      }

      return { success: false, message: '更新失敗' }
    } catch (err) {
      console.error('Store 修改醫療紀錄失敗:', err)
      const message = err.response?.data?.message || '修改失敗'
      errorMsg.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteRecord(recordId, petId) {
    isLoading.value = true
    errorMsg.value = ''

    try {
      const response = await medicalApi.deleteRecord(recordId)

      if (response.status === 200) {
        await fetchRecords(petId)
        return { success: true }
      }

      return { success: false, message: '刪除失敗' }
    } catch (err) {
      console.error('Store 刪除醫療紀錄失敗:', err)
      const message = err.response?.data?.message || '刪除失敗'
      errorMsg.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    records.value = []
    isLoading.value = false
    errorMsg.value = ''
  }

  return {
    records,
    isLoading,
    errorMsg,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    reset,
  }
})
