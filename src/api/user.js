import axios from 'axios'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''
const TOKEN_STORAGE_KEY = 'pawpal_token'

function hasOwnValue(data, key) {
  return Object.hasOwn(data, key) && data[key] !== undefined && data[key] !== null
}

function getAuthHeaders(token = globalThis.localStorage?.getItem(TOKEN_STORAGE_KEY) || '') {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

function normalizeString(value) {
  return value?.trim?.() ?? value
}

function getAvatarFile(data = {}) {
  return data.avatarFile || data.photoFile || data.photo_files?.[0] || null
}

function appendIfPresent(formData, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, value)
  }
}

export function buildUpdateUserProfilePayload(data = {}) {
  const payload = {}

  if (hasOwnValue(data, 'name')) {
    payload.name = normalizeString(data.name)
  }

  if (hasOwnValue(data, 'avatar_url')) {
    payload.avatar_url = normalizeString(data.avatar_url)
  } else if (hasOwnValue(data, 'avatarUrl')) {
    payload.avatar_url = normalizeString(data.avatarUrl)
  } else if (hasOwnValue(data, 'photoUrl')) {
    payload.avatar_url = normalizeString(data.photoUrl)
  }

  return payload
}

export function updateUserProfileRequestConfig(data = {}, token) {
  const avatarFile = getAvatarFile(data)
  const payload = buildUpdateUserProfilePayload(data)

  if (avatarFile) {
    const formData = new FormData()

    Object.entries(payload).forEach(([key, value]) => {
      appendIfPresent(formData, key, value)
    })
    formData.append('avatar', avatarFile)

    return {
      data: formData,
      headers: getAuthHeaders(token),
    }
  }

  return {
    data: payload,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
  }
}

function getErrorMessage(error) {
  const status = error.response?.status
  const backendMessage = error.response?.data?.message

  if (status === 400 || status === 422) {
    return backendMessage || '會員資料格式不正確，請確認姓名與照片網址'
  }

  if (status === 401 || status === 403) {
    return backendMessage || '登入狀態已失效，請重新登入'
  }

  if (status === 404) {
    return backendMessage || '找不到會員資料'
  }

  return backendMessage || '會員資料更新失敗，請稍後再試'
}

export async function updateUserProfile(data, token) {
  try {
    const request = updateUserProfileRequestConfig(data, token)
    const response = await axios.patch(`${API_BASE_URL}/api/v1/users/me`, request.data, {
      headers: request.headers,
    })

    return {
      success: true,
      message: response.data?.message || '會員資料更新成功',
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
      data: error.response?.data || null,
    }
  }
}
