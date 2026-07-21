import axios from 'axios'
import { getClientIdHeaders } from './clientId.js'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''
const API_PREFIX = '/api/v1'

export const TAIPEI_CENTER = [25.033, 121.5654]

function isPresent(value) {
  return value !== undefined && value !== null && value !== ''
}

function toNumberOrNull(value) {
  if (!isPresent(value)) {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function getAuthHeaders() {
  const token = globalThis.localStorage?.getItem('pawpal_token')

  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

function normalizeAnimalTypes(animalTypes) {
  if (!Array.isArray(animalTypes)) {
    return []
  }

  return animalTypes.map((animalType) => {
    if (typeof animalType === 'string') {
      return {
        slug: animalType,
        name: animalType,
      }
    }

    return {
      slug: animalType.slug ?? animalType.name ?? '',
      name: animalType.name ?? animalType.slug ?? '',
      verificationStatus: animalType.verification_status ?? animalType.verificationStatus ?? '',
      source: animalType.source ?? '',
    }
  })
}

export function buildHospitalListQuery(filters = {}) {
  const query = {
    keyword: filters.keyword,
    city: filters.city,
    district: filters.district,
    is_24h: filters.is_24h ?? filters.is24H,
    favorites_only: filters.favorites_only ?? filters.favoritesOnly,
    sort: filters.sort,
    lat: filters.lat,
    lng: filters.lng,
    page: filters.page,
    limit: filters.limit,
  }

  return Object.fromEntries(Object.entries(query).filter(([, value]) => isPresent(value)))
}

export function buildHospitalMapQuery(bounds = {}) {
  const query = { north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west }
  return Object.fromEntries(Object.entries(query).filter(([, value]) => isPresent(value)))
}

export function buildNearbyHospitalQuery(options = {}) {
  const location = options.location ?? {}
  const lat = options.lat ?? location.lat ?? TAIPEI_CENTER[0]
  const lng = options.lng ?? location.lng ?? TAIPEI_CENTER[1]

  const query = {
    lat,
    lng,
    radius: options.radius,
    limit: options.limit,
    favorites_only: options.favorites_only ?? options.favoritesOnly,
  }

  return Object.fromEntries(Object.entries(query).filter(([, value]) => isPresent(value)))
}

export function normalizeHospital(hospital = {}) {
  const latitude = toNumberOrNull(hospital.latitude ?? hospital.lat)
  const longitude = toNumberOrNull(hospital.longitude ?? hospital.lng)
  const distanceKm = toNumberOrNull(hospital.distance_km ?? hospital.distanceKm ?? hospital.distance)
  const animalTypes = normalizeAnimalTypes(hospital.animal_types ?? hospital.animalTypes)
  const categories = hospital.categories ?? animalTypes.map((animalType) => animalType.name).filter(Boolean)
  const is24H = Boolean(hospital.is_24h ?? hospital.is24H ?? hospital.is24h)
  const businessHours = hospital.business_hours ?? hospital.businessHours ?? (is24H ? '24 小時營業' : '請洽醫院')
  const rating = Number(hospital.rating_average ?? hospital.average_rating ?? hospital.rating ?? 0)

  return {
    ...hospital,
    id: hospital.id,
    name: hospital.name ?? '未命名醫院',
    city: hospital.city ?? '',
    district: hospital.district ?? '',
    address: hospital.address ?? '',
    phone: hospital.phone ?? '',
    latitude,
    longitude,
    lat: latitude,
    lng: longitude,
    animalTypes,
    categories,
    distanceKm,
    distance: distanceKm ?? hospital.distance ?? '—',
    isOpen: Boolean(hospital.is_open ?? hospital.isOpen ?? is24H),
    is24H,
    businessHours,
    rating,
    reviewCount: Number(hospital.review_count ?? hospital.reviewCount ?? 0),
    isFavorite: Boolean(hospital.is_favorite ?? hospital.isFavorite),
  }
}

function normalizeHospitalResponse(data = {}, fallbackPagination = {}) {
  const rawHospitals = Array.isArray(data)
    ? data
    : Array.isArray(data.hospitals)
      ? data.hospitals
      : Array.isArray(data.data?.hospitals)
        ? data.data.hospitals
        : []

  const rawPagination = data.pagination ?? data.data?.pagination ?? fallbackPagination

  return {
    hospitals: rawHospitals.map(normalizeHospital),
    pagination: {
      page: Number(rawPagination.page ?? fallbackPagination.page ?? 1),
      limit: Number(rawPagination.limit ?? fallbackPagination.limit ?? 20),
      total: Number(rawPagination.total ?? rawHospitals.length),
      totalPages: Number(rawPagination.total_pages ?? rawPagination.totalPages ?? 1),
    },
  }
}

function getErrorMessage(error, fallbackMessage) {
  return error.response?.data?.message || error.message || fallbackMessage
}

function normalizeReviewSummary(summary = {}) {
  return {
    average_rating: Number(summary.average_rating ?? summary.averageRating ?? summary.rating ?? 0),
    review_count: Number(summary.review_count ?? summary.reviewCount ?? 0),
  }
}

export async function fetchHospitals(filters = {}) {
  const params = buildHospitalListQuery(filters)

  try {
    const response = await axios.get(`${API_BASE_URL}${API_PREFIX}/hospitals`, {
      params,
      headers: getAuthHeaders(),
    })
    const normalized = normalizeHospitalResponse(response.data, {
      page: params.page,
      limit: params.limit,
    })

    return {
      success: true,
      ...normalized,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, '取得醫院清單失敗，請稍後再試'),
      hospitals: [],
      pagination: {
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        total: 0,
        totalPages: 0,
      },
    }
  }
}

export async function fetchNearbyHospitals(options = {}) {
  const params = buildNearbyHospitalQuery(options)

  try {
    const response = await axios.get(`${API_BASE_URL}${API_PREFIX}/hospitals/nearby`, {
      params,
      headers: getAuthHeaders(),
    })
    const normalized = normalizeHospitalResponse(response.data, {
      page: 1,
      limit: params.limit,
    })

    return {
      success: true,
      ...normalized,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, '取得附近醫院失敗，請稍後再試'),
      hospitals: [],
      pagination: {
        page: 1,
        limit: Number(params.limit ?? 20),
        total: 0,
        totalPages: 0,
      },
    }
  }
}

export async function fetchHospitalRegions() {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_PREFIX}/hospitals/regions`)
    return { success: true, regions: Array.isArray(response.data?.regions) ? response.data.regions : [] }
  } catch (error) {
    return { success: false, regions: [], message: getErrorMessage(error, '取得醫院地區失敗，請稍後再試') }
  }
}

export async function fetchMapHospitals(bounds = {}, options = {}) {
  const params = buildHospitalMapQuery(bounds)
  try {
    const response = await axios.get(`${API_BASE_URL}${API_PREFIX}/hospitals/map`, {
      params,
      headers: getClientIdHeaders(),
      signal: options.signal,
    })
    return {
      success: true,
      hospitals: (response.data?.hospitals ?? []).map(normalizeHospital),
      total: Number(response.data?.total ?? 0),
      truncated: Boolean(response.data?.truncated),
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      return { success: false, canceled: true, hospitals: [], total: 0, truncated: false }
    }

    return {
      success: false,
      canceled: false,
      hospitals: [],
      total: 0,
      truncated: false,
      message: getErrorMessage(error, '取得地圖醫院失敗，請稍後再試'),
    }
  }
}

export async function addFavoriteHospital(hospitalId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_PREFIX}/hospitals/${hospitalId}/favorite`,
      undefined,
      { headers: getAuthHeaders() },
    )

    return { success: true, message: response.data?.message ?? '已加入收藏' }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, '收藏醫院失敗，請稍後再試') }
  }
}

export async function removeFavoriteHospital(hospitalId) {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}${API_PREFIX}/hospitals/${hospitalId}/favorite`,
      { headers: getAuthHeaders() },
    )

    return { success: true, message: response.data?.message ?? '已取消收藏' }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, '取消收藏失敗，請稍後再試') }
  }
}

export async function fetchHospitalReviews(hospitalId) {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_PREFIX}/hospitals/${hospitalId}/reviews`)

    return {
      success: true,
      summary: normalizeReviewSummary(response.data?.summary),
      reviews: Array.isArray(response.data?.reviews) ? response.data.reviews : [],
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, '讀取醫院評論失敗，請稍後再試'),
      summary: normalizeReviewSummary(),
      reviews: [],
    }
  }
}

export async function submitHospitalReview(hospitalId, payload = {}) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_PREFIX}/hospitals/${hospitalId}/reviews`,
      {
        rating: payload.rating,
        comment: payload.comment,
      },
      { headers: getAuthHeaders() },
    )

    return {
      success: true,
      message: response.data?.message ?? '評論已送出',
      review: response.data?.review ?? null,
      summary: normalizeReviewSummary(response.data?.summary),
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, '送出評論失敗，請稍後再試'),
      review: null,
      summary: normalizeReviewSummary(),
    }
  }
}

export async function updateHospitalReview(hospitalId, _reviewId, payload = {}) {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}${API_PREFIX}/hospitals/${hospitalId}/reviews/me`,
      {
        rating: payload.rating,
        comment: payload.comment,
      },
      { headers: getAuthHeaders() },
    )

    return {
      success: true,
      message: response.data?.message ?? '評論已更新',
      review: response.data?.review ?? null,
      summary: normalizeReviewSummary(response.data?.summary),
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, '更新評論失敗，請稍後再試'),
      review: null,
      summary: normalizeReviewSummary(),
    }
  }
}

export async function deleteHospitalReview(hospitalId, _reviewId) {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}${API_PREFIX}/hospitals/${hospitalId}/reviews/me`,
      { headers: getAuthHeaders() },
    )

    return {
      success: true,
      message: response.data?.message ?? '評論已刪除',
      summary: normalizeReviewSummary(response.data?.summary),
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, '刪除評論失敗，請稍後再試'),
      summary: normalizeReviewSummary(),
    }
  }
}
