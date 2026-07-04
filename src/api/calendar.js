import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const BASE_PATH = '/api/v1/calendar-events'

// 後端 snake_case → 前端 camelCase
function fromApi(row) {
  return {
    id: row.id,
    petId: row.pet_id,
    title: row.title,
    eventDate: row.event_date,
    eventTime: row.event_time ? row.event_time.slice(0, 5) : row.event_time,
    type: row.type,
    location: row.location,
    notes: row.notes,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// 前端 camelCase → 後端新增 body（snake_case）
function toCreateBody(form) {
  return {
    pet_id: form.petId,
    title: form.title,
    event_date: form.eventDate,
    event_time: form.eventTime || undefined,
    type: form.type,
    location: form.location || undefined,
    notes: form.notes || undefined,
  }
}

// 前端 camelCase → 後端更新 body（snake_case，只帶有值的欄位）
function toUpdateBody(form) {
  const body = {}
  if (form.title !== undefined) body.title = form.title
  if (form.eventDate !== undefined) body.event_date = form.eventDate
  if (form.eventTime) body.event_time = form.eventTime
  if (form.type !== undefined) body.type = form.type
  if (form.location !== undefined) body.location = form.location
  if (form.notes !== undefined) body.notes = form.notes
  if (form.isCompleted !== undefined) body.is_completed = form.isCompleted
  return body
}

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

export async function getEvents(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}${BASE_PATH}`, authConfig(token))

    return {
      success: true,
      message: response.data?.message || '取得成功',
      data: (response.data?.data || []).map(fromApi),
    }
  } catch (error) {
    return toError(error)
  }
}

export async function createEvent(form, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${BASE_PATH}`,
      toCreateBody(form),
      authConfig(token),
    )

    return {
      success: true,
      message: response.data?.message || '新增成功',
      data: fromApi(response.data?.data),
    }
  } catch (error) {
    return toError(error)
  }
}

export async function updateEvent(id, form, token) {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}${BASE_PATH}/${id}`,
      toUpdateBody(form),
      authConfig(token),
    )

    return {
      success: true,
      message: response.data?.message || '更新成功',
      data: fromApi(response.data?.data),
    }
  } catch (error) {
    return toError(error)
  }
}

export async function deleteEvent(id, token) {
  try {
    await axios.delete(`${API_BASE_URL}${BASE_PATH}/${id}`, authConfig(token))

    return {
      success: true,
      message: '刪除成功',
      data: null,
    }
  } catch (error) {
    return toError(error)
  }
}
