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
      message: error.response?.data?.message || '寵物資料更新失敗，請稍後再試',
      data: error.response?.data || null,
    }
  }
}
