import axios from 'axios'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''
const TOKEN_STORAGE_KEY = 'pawpal_token'

function hasValue(value) {
  return value !== '' && value !== null && value !== undefined
}

function assignIfPresent(payload, key, value) {
  if (hasValue(value)) {
    payload[key] = value
  }
}

function normalizeWeight(weight) {
  if (!hasValue(weight)) {
    return undefined
  }

  const numericWeight = Number(weight)

  return Number.isNaN(numericWeight) ? weight : numericWeight
}

function getAuthHeaders(token = globalThis.localStorage?.getItem(TOKEN_STORAGE_KEY) || '') {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

function appendIfPresent(formData, key, value) {
  if (hasValue(value)) {
    formData.append(key, value)
  }
}

export function mapPetToApi(data = {}) {
  const payload = {}

  assignIfPresent(payload, 'name', data.name?.trim?.() ?? data.name)
  assignIfPresent(payload, 'species', data.species?.trim?.() ?? data.species)
  assignIfPresent(payload, 'breed', data.breed?.trim?.() ?? data.breed)
  assignIfPresent(payload, 'gender', data.gender?.trim?.() ?? data.gender)
  assignIfPresent(payload, 'birthday', data.birthday)
  assignIfPresent(payload, 'weight', normalizeWeight(data.weight))
  assignIfPresent(payload, 'microchip_number', data.microchipNumber?.trim?.() ?? data.microchipNumber)
  assignIfPresent(payload, 'neutered', data.neutered)
  assignIfPresent(payload, 'blood_type', data.bloodType?.trim?.() ?? data.bloodType)
  assignIfPresent(payload, 'fur_color', data.furColor?.trim?.() ?? data.furColor)
  assignIfPresent(payload, 'notes', data.note?.trim?.() ?? data.note)
  assignIfPresent(payload, 'avatar_url', data.photoUrl?.trim?.() ?? data.photoUrl)

  return payload
}

export function buildUpdatePetPayload(data = {}) {
  return mapPetToApi(data)
}

export function createPetRequestData(data) {
  const avatarFile = data.avatarFile || data.photoFile || data.photo_files?.[0] || null
  const payload = mapPetToApi(data)

  if (!avatarFile) {
    return {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    }
  }

  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    appendIfPresent(formData, key, value)
  })
  formData.append('avatar', avatarFile)

  return {
    data: formData,
    headers: getAuthHeaders(),
  }
}

export function mapPetFromApi(pet) {
  if (!pet) {
    return null
  }

  return {
    ...pet,
    microchipNumber: pet.microchip_number ?? pet.microchipNumber,
    bloodType: pet.blood_type ?? pet.bloodType,
    furColor: pet.fur_color ?? pet.furColor,
    note: pet.notes ?? pet.note,
    photoUrl: pet.avatar_url ?? pet.photoUrl ?? pet.avatarUrl,
    image: pet.avatar_url ?? pet.photoUrl ?? pet.avatarUrl ?? pet.image ?? null,
    ageUnit: pet.ageUnit ?? '',
  }
}

export function normalizePetFromApi(pet = {}) {
  return mapPetFromApi(pet) ?? null
}

function getErrorMessage(error, fallbackMessage) {
  const status = error.response?.status
  const backendMessage = error.response?.data?.message

  if (status === 400 || status === 422) {
    return backendMessage || '請確認必填欄位與資料格式是否正確'
  }

  if (status === 401 || status === 403) {
    return backendMessage || '登入已過期，請重新登入後再試'
  }

  if (status === 409) {
    return backendMessage || '晶片號碼已被使用'
  }

  return backendMessage || fallbackMessage
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

export async function listPets() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/pets`, {
      headers: getAuthHeaders(),
    })

    return {
      success: true,
      message: response.data?.message || '寵物資料取得成功',
      data: {
        ...response.data,
        pets: response.data?.pets?.map(mapPetFromApi) ?? [],
      },
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, '寵物資料取得失敗，請稍後再試'),
      data: error.response?.data || null,
    }
  }
}

export async function createPet(data) {
  try {
    const request = createPetRequestData(data)
    const response = await axios.post(`${API_BASE_URL}/api/v1/pets`, request.data, {
      headers: request.headers,
    })

    return {
      success: true,
      message: response.data?.message || '寵物資料新增成功',
      data: {
        ...response.data,
        pet: mapPetFromApi(response.data?.pet),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, '寵物資料新增失敗，請稍後再試'),
      data: error.response?.data || null,
    }
  }
}

export async function updatePet(id, data, token) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/api/v1/pets/${id}`, buildUpdatePetPayload(data), {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token),
      },
    })

    return {
      success: true,
      message: response.data?.message || '寵物資料更新成功',
      data: {
        ...response.data,
        pet: mapPetFromApi(response.data?.pet),
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
