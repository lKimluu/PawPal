import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function request(method, path, { payload, token } = {}) {
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${path}`,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    return {
      success: true,
      message: response.data?.message || '請求成功',
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || '無法連線到伺服器',
      data: error.response?.data || null,
    }
  }
}

export function getGrowthRecords(petId, token) {
  return request('get', `/api/v1/growth-records?pet_id=${petId}`, { token })
}

export function createGrowthRecord(payload, token) {
  return request('post', '/api/v1/growth-records', { payload, token })
}
