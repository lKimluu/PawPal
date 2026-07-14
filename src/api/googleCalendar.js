import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const BASE_PATH = '/api/v1/google-calendar'

function authConfig(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

function toError(error) {
  return {
    success: false,
    message: error.response?.data?.message || '無法連線到伺服器',
    data: null,
  }
}

export async function getGoogleCalendarStatus(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}${BASE_PATH}/status`, authConfig(token))

    return {
      success: true,
      message: response.data?.message || '取得成功',
      data: response.data?.data || { connected: false },
    }
  } catch (error) {
    return toError(error)
  }
}

export async function connectGoogleCalendar(code, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${BASE_PATH}/connect`,
      { code },
      authConfig(token),
    )

    return {
      success: true,
      message: response.data?.message || 'Google 行事曆連接成功',
      data: response.data?.data || { connected: true },
    }
  } catch (error) {
    return toError(error)
  }
}

export async function disconnectGoogleCalendar(token) {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}${BASE_PATH}/disconnect`,
      authConfig(token),
    )

    return {
      success: true,
      message: response.data?.message || '已中斷 Google 行事曆連接',
      data: null,
    }
  } catch (error) {
    return toError(error)
  }
}
