import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function request(path, payload) {
  try {
    const response = await axios.post(`${API_BASE_URL}${path}`, payload, {
      headers: {
        'Content-Type': 'application/json',
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

export function register(payload) {
  return request('/api/v1/auth/register', payload)
}

export function login(payload) {
  return request('/api/v1/auth/login', payload)
}

export function loginWithGoogleApi(googleIdToken) {
  return request('/api/v1/auth/google-login', { token: googleIdToken })
}
