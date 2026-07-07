import axios from 'axios'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''
const API_PREFIX = '/api/v1'

const getAuthHeaders = (contentType = 'application/json') => {
  const token = globalThis.localStorage?.getItem('pawpal_token')
  const headers = {
    Authorization: token ? `Bearer ${token}` : '',
  }

  if (contentType) {
    headers['Content-Type'] = contentType
  }

  return headers
}

function appendIfPresent(formData, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, value)
  }
}

function buildRecordFormData(payload) {
  const formData = new FormData()
  const rawFiles = Array.isArray(payload.rawFiles) ? payload.rawFiles : []

  appendIfPresent(formData, 'pet_id', payload.pet_id)
  appendIfPresent(formData, 'record_type', payload.record_type)
  appendIfPresent(formData, 'hospital_name', payload.hospital_name)
  appendIfPresent(formData, 'title', payload.title)
  appendIfPresent(formData, 'record_date', payload.record_date)
  appendIfPresent(formData, 'symptoms', payload.symptoms)
  appendIfPresent(formData, 'diagnosis', payload.diagnosis)
  appendIfPresent(formData, 'prescription', payload.prescription)

  if (Array.isArray(payload.image_url)) {
    payload.image_url
      .filter((url) => typeof url === 'string' && url.startsWith('http'))
      .forEach((url) => formData.append('image_url', url))
  }

  rawFiles.forEach((file) => formData.append('images', file))

  return formData
}

export function createRecordRequestData(payload) {
  const rawFiles = Array.isArray(payload.rawFiles) ? payload.rawFiles : []

  if (rawFiles.length === 0) {
    const { rawFiles: _rawFiles, ...jsonPayload } = payload
    return {
      data: jsonPayload,
      headers: getAuthHeaders(),
    }
  }

  return {
    data: buildRecordFormData(payload),
    headers: getAuthHeaders(null),
  }
}

export const medicalApi = {
  getUserPets() {
    return axios.get(`${API_BASE_URL}${API_PREFIX}/pets`, {
      headers: getAuthHeaders(),
    })
  },

  getRecordsByPet(petId) {
    return axios.get(`${API_BASE_URL}${API_PREFIX}/medical-records/pet/${Number(petId)}`, {
      headers: getAuthHeaders(),
    })
  },

  createRecord(payload) {
    const request = createRecordRequestData(payload)

    return axios.post(`${API_BASE_URL}${API_PREFIX}/medical-records`, request.data, {
      headers: request.headers,
    })
  },

  updateRecord(recordId, payload) {
    const request = createRecordRequestData(payload)

    return axios.patch(`${API_BASE_URL}${API_PREFIX}/medical-records/${recordId}`, request.data, {
      headers: request.headers,
    })
  },

  deleteRecord(recordId) {
    return axios.delete(`${API_BASE_URL}${API_PREFIX}/medical-records/${recordId}`, {
      headers: getAuthHeaders(),
    })
  },
}
