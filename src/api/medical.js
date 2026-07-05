import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_PREFIX = '/api/v1'

const getAuthHeaders = () => {
  const token = localStorage.getItem('pawpal_token')

  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
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
    return axios.post(`${API_BASE_URL}${API_PREFIX}/medical-records`, payload, {
      headers: getAuthHeaders(),
    })
  },

  updateRecord(recordId, payload) {
    return axios.patch(`${API_BASE_URL}${API_PREFIX}/medical-records/${recordId}`, payload, {
      headers: getAuthHeaders(),
    })
  },

  deleteRecord(recordId) {
    return axios.delete(`${API_BASE_URL}${API_PREFIX}/medical-records/${recordId}`, {
      headers: getAuthHeaders(),
    })
  },
}
