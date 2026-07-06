import axios from 'axios'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''

const FIELD_MAP = {
  microchipNumber: 'microchip_number',
  bloodType: 'blood_type',
  furColor: 'fur_color',
  photoUrl: 'avatar_url',
  note: 'notes',
}

function normalizeOptionalValue(value) {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    return trimmedValue === '' ? undefined : trimmedValue
  }

  if (value === '') {
    return undefined
  }

  return value
}

function normalizeWeight(value) {
  if (value === '' || value == null) {
    return undefined
  }

  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? undefined : numericValue
}

export function buildUpdatePetPayload(data = {}) {
  const payload = {}

  Object.entries(data).forEach(([key, value]) => {
    const targetKey = FIELD_MAP[key] ?? key
    const normalizedValue = targetKey === 'weight' ? normalizeWeight(value) : normalizeOptionalValue(value)

    if (normalizedValue !== undefined) {
      payload[targetKey] = normalizedValue
    }
  })

  return payload
}

export function normalizePetFromApi(pet = {}) {
  return {
    ...pet,
    microchipNumber: pet.microchipNumber ?? pet.microchip_number,
    bloodType: pet.bloodType ?? pet.blood_type,
    furColor: pet.furColor ?? pet.fur_color,
    note: pet.note ?? pet.notes,
    photoUrl: pet.photoUrl ?? pet.avatar_url ?? pet.avatarUrl,
  }
}

export function resolvePetUpdateErrorMessage(error) {
  if (!error?.response) {
    return '無法連線到伺服器，請確認後端服務是否已啟動'
  }

  const status = error.response.status
  const backendMessage = error.response.data?.message || ''

  if (status === 404) {
    return '找不到這隻寵物，請重新整理後再試'
  }

  if (status === 409 || backendMessage.includes('microchip') || backendMessage.includes('晶片')) {
    return '晶片號碼已被使用，請確認後再送出'
  }

  if (status === 400 || status === 422) {
    return '寵物資料格式不正確，請檢查必填欄位與體重格式'
  }

  return backendMessage || '寵物資料更新失敗，請稍後再試'
}

export async function updatePet(id, data, token) {
  try {
    const payload = buildUpdatePetPayload(data)

    const response = await axios.patch(`${API_BASE_URL}/api/v1/pets/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    return {
      success: true,
      message: response.data?.message || '寵物資料更新成功',
      data: {
        ...response.data,
        pet: response.data?.pet ? normalizePetFromApi(response.data.pet) : null,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: resolvePetUpdateErrorMessage(error),
      data: error.response?.data || null,
    }
  }
}
