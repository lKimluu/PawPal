import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addFavoriteHospital as addFavoriteHospitalRequest,
  fetchHospitalRegions,
  fetchHospitals,
  fetchHospitalReviews,
  fetchMapHospitals,
  fetchNearbyHospitals,
  removeFavoriteHospital as removeFavoriteHospitalRequest,
  deleteHospitalReview as deleteHospitalReviewRequest,
  submitHospitalReview as submitHospitalReviewRequest,
  updateHospitalReview as updateHospitalReviewRequest,
  TAIPEI_CENTER,
} from '../api/hospitals.js'

const DEFAULT_PAGINATION = { page: 1, limit: 20, total: 0, totalPages: 0 }
const DEFAULT_FILTERS = {
  keyword: '',
  city: '',
  district: '',
  is24H: false,
  favoritesOnly: false,
  sort: 'name',
}

export const useHospitalStore = defineStore('hospital', () => {
  const hospitals = ref([])
  const mapHospitals = ref([])
  const regions = ref([])
  const pagination = ref({ ...DEFAULT_PAGINATION })
  const filters = ref({ ...DEFAULT_FILTERS })
  const mode = ref('list')
  const selectedHospitalId = ref(null)
  const pendingEntryHospital = ref(null)
  const entrySelectedHospital = ref(null)
  const isLoading = ref(false)
  const mapLoading = ref(false)
  const regionsLoading = ref(false)
  const errorMessage = ref('')
  const mapError = ref('')
  const regionsError = ref('')
  const mapTruncated = ref(false)
  const locationFallbackMessage = ref('')
  const hasRealLocation = ref(false)
  const userCoordinates = ref(null)
  const explicitSortSelection = ref(null)
  const lastQuery = ref({ type: 'list', query: {} })
  const lastMapQuery = ref(null)
  let listRequestId = 0
  let mapRequestId = 0
  let regionsRequestId = 0
  let mapRequestController = null

  const visibleHospitals = computed(() => hospitals.value)
  const markerHospitals = computed(() => mapHospitals.value)
  const selectedHospital = computed(() => {
    const selectedId = selectedHospitalId.value
    if (selectedId === null || selectedId === undefined) return null

    return (
      hospitals.value.find((item) => String(item.id) === String(selectedId)) ??
      mapHospitals.value.find((item) => String(item.id) === String(selectedId)) ??
      (String(entrySelectedHospital.value?.id) === String(selectedId)
        ? entrySelectedHospital.value
        : null)
    )
  })
  const isEmpty = computed(() => !isLoading.value && !errorMessage.value && hospitals.value.length === 0)
  const availableDistricts = computed(() => regions.value.find((item) => item.city === filters.value.city)?.districts ?? [])

  function enterHospitalPage() {
    const queuedHospital = pendingEntryHospital.value
    pendingEntryHospital.value = null
    listRequestId += 1
    mapRequestId += 1
    mapRequestController?.abort()
    mapRequestController = null

    hospitals.value = []
    mapHospitals.value = []
    pagination.value = { ...DEFAULT_PAGINATION }
    filters.value = { ...DEFAULT_FILTERS }
    mode.value = 'list'
    entrySelectedHospital.value = queuedHospital
    selectedHospitalId.value = queuedHospital?.id ?? null
    isLoading.value = false
    mapLoading.value = false
    errorMessage.value = ''
    mapError.value = ''
    mapTruncated.value = false
    locationFallbackMessage.value = ''
    hasRealLocation.value = false
    userCoordinates.value = null
    explicitSortSelection.value = null
    lastQuery.value = { type: 'list', query: {} }
    lastMapQuery.value = null
  }

  function queueHospitalEntrySelection(hospital) {
    pendingEntryHospital.value =
      hospital && hospital.id !== null && hospital.id !== undefined ? { ...hospital } : null
  }

  function listQuery(overrides = {}) {
    const coordinates = hasRealLocation.value
      && Number.isFinite(userCoordinates.value?.lat)
      && Number.isFinite(userCoordinates.value?.lng)
      ? userCoordinates.value
      : null
    return {
      keyword: filters.value.keyword,
      city: filters.value.city,
      district: filters.value.district,
      is24H: filters.value.is24H || undefined,
      favoritesOnly: filters.value.favoritesOnly || undefined,
      sort: filters.value.sort,
      lat: coordinates?.lat,
      lng: coordinates?.lng,
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...overrides,
    }
  }

  async function loadHospitals(overrides = {}) {
    const requestId = ++listRequestId
    mode.value = 'list'
    isLoading.value = true
    errorMessage.value = ''
    locationFallbackMessage.value = ''
    const query = listQuery(overrides)
    lastQuery.value = { type: 'list', query }
    const result = await fetchHospitals(query)
    if (requestId !== listRequestId) return result
    if (result.success) {
      hospitals.value = result.hospitals
      pagination.value = { ...DEFAULT_PAGINATION, ...result.pagination }
    } else {
      errorMessage.value = result.message
    }
    isLoading.value = false
    return result
  }

  async function loadNearbyHospitals({ location = null, locationError = '', radius = 5, limit = 20 } = {}) {
    const requestId = ++listRequestId
    const valid = location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
    const retryQuery = { location: valid ? location : null, locationError, radius, limit }
    const gainedRealLocation = !hasRealLocation.value && Boolean(valid)
    hasRealLocation.value = Boolean(valid)
    userCoordinates.value = valid ? location : null
    if (gainedRealLocation && !filters.value.keyword && explicitSortSelection.value === null) {
      filters.value.sort = 'distance'
    }
    const query = {
      location: valid ? location : { lat: TAIPEI_CENTER[0], lng: TAIPEI_CENTER[1] },
      radius,
      limit,
      favoritesOnly: filters.value.favoritesOnly || undefined,
    }
    mode.value = 'nearby'
    isLoading.value = true
    errorMessage.value = ''
    locationFallbackMessage.value = valid ? '' : locationError || '未取得目前位置，顯示台北市中心附近醫院。'
    lastQuery.value = { type: 'nearby', query: retryQuery }
    const result = await fetchNearbyHospitals(query)
    if (requestId !== listRequestId) return result
    if (result.success) {
      hospitals.value = result.hospitals
      pagination.value = { page: 1, limit, total: result.hospitals.length, totalPages: 1 }
    } else errorMessage.value = result.message
    isLoading.value = false
    return result
  }

  async function loadMapHospitals(bounds) {
    const requestId = ++mapRequestId
    mapRequestController?.abort()
    const requestController = new AbortController()
    mapRequestController = requestController
    lastMapQuery.value = bounds
    mapLoading.value = true
    mapError.value = ''
    const result = await fetchMapHospitals(bounds, { signal: requestController.signal })
    if (requestId !== mapRequestId || requestController !== mapRequestController) return result
    if (result.success) {
      mapHospitals.value = result.hospitals
      mapTruncated.value = result.truncated
    } else if (!result.canceled) mapError.value = result.message
    mapLoading.value = false
    mapRequestController = null
    return result
  }

  async function loadRegions() {
    const requestId = ++regionsRequestId
    regionsLoading.value = true
    regionsError.value = ''
    const result = await fetchHospitalRegions()
    if (requestId !== regionsRequestId) return result
    if (result.success) regions.value = result.regions
    else regionsError.value = result.message
    regionsLoading.value = false
    return result
  }

  async function setKeyword(keyword) {
    filters.value.keyword = keyword.trim()
    filters.value.sort = filters.value.keyword
      ? 'relevance'
      : explicitSortSelection.value ?? (hasRealLocation.value ? 'distance' : 'name')
    pagination.value.page = 1
    return loadHospitals({ page: 1 })
  }
  async function setLocationFilter({ city = '', district = '' } = {}) {
    filters.value.city = city
    filters.value.district = district
    pagination.value.page = 1
    return loadHospitals({ page: 1 })
  }
  async function set24H(value) { filters.value.is24H = Boolean(value); pagination.value.page = 1; return loadHospitals({ page: 1 }) }
  async function setFavoritesOnly(value) { filters.value.favoritesOnly = Boolean(value); pagination.value.page = 1; return loadHospitals({ page: 1 }) }
  async function setSort(value) { if (value === 'distance' && !hasRealLocation.value) return; explicitSortSelection.value = value; filters.value.sort = value; pagination.value.page = 1; return loadHospitals({ page: 1 }) }
  async function setPage(page) { pagination.value.page = Number(page); return loadHospitals({ page: pagination.value.page }) }
  async function clearFilters() { explicitSortSelection.value = null; filters.value = { ...DEFAULT_FILTERS, sort: hasRealLocation.value ? 'distance' : 'name' }; pagination.value.page = 1; return loadHospitals({ page: 1 }) }
  function selectHospital(id) {
    selectedHospitalId.value = id
    if (String(entrySelectedHospital.value?.id) !== String(id)) {
      entrySelectedHospital.value = null
    }
  }
  function retryCurrentQuery() { return lastQuery.value.type === 'nearby' ? loadNearbyHospitals(lastQuery.value.query) : loadHospitals(lastQuery.value.query) }
  function retryMapQuery() { return lastMapQuery.value ? loadMapHospitals(lastMapQuery.value) : Promise.resolve() }
  function updateHospitalReviewSummary(hospitalId, summary = {}) {
    const rating = Number(summary.average_rating ?? summary.averageRating ?? summary.rating ?? 0)
    const reviewCount = Number(summary.review_count ?? summary.reviewCount ?? 0)
    const applySummary = (item) =>
      item.id === hospitalId || String(item.id) === String(hospitalId)
        ? { ...item, rating, reviewCount, average_rating: rating, review_count: reviewCount }
        : item

    hospitals.value = hospitals.value.map(applySummary)
    mapHospitals.value = mapHospitals.value.map(applySummary)
    if (entrySelectedHospital.value) {
      entrySelectedHospital.value = applySummary(entrySelectedHospital.value)
    }
  }
  function applyFavoriteState(hospitalId, isFavorite) {
    const applyFavorite = (item) =>
      item.id === hospitalId || String(item.id) === String(hospitalId)
        ? { ...item, isFavorite }
        : item

    hospitals.value = hospitals.value.map(applyFavorite)
    mapHospitals.value = mapHospitals.value.map(applyFavorite)
  }
  async function toggleFavoriteHospital(hospitalId, currentIsFavorite) {
    const result = currentIsFavorite
      ? await removeFavoriteHospitalRequest(hospitalId)
      : await addFavoriteHospitalRequest(hospitalId)
    if (result.success) {
      if (currentIsFavorite && filters.value.favoritesOnly) {
        await retryCurrentQuery()
      } else {
        applyFavoriteState(hospitalId, !currentIsFavorite)
      }
    }
    return result
  }
  function getHospitalById(hospitalId) {
    return (
      hospitals.value.find((item) => String(item.id) === String(hospitalId)) ??
      mapHospitals.value.find((item) => String(item.id) === String(hospitalId)) ??
      (String(entrySelectedHospital.value?.id) === String(hospitalId)
        ? entrySelectedHospital.value
        : null) ??
      null
    )
  }
  async function loadHospitalReviews(hospitalId) {
    const result = await fetchHospitalReviews(hospitalId)
    if (result.success) updateHospitalReviewSummary(hospitalId, result.summary)
    return result
  }
  async function submitHospitalReview(hospitalId, payload) {
    const result = await submitHospitalReviewRequest(hospitalId, payload)
    if (result.success) updateHospitalReviewSummary(hospitalId, result.summary)
    return result
  }
  async function updateHospitalReview(hospitalId, reviewId, payload) {
    const result = await updateHospitalReviewRequest(hospitalId, reviewId, payload)
    if (result.success) updateHospitalReviewSummary(hospitalId, result.summary)
    return result
  }
  async function deleteHospitalReview(hospitalId, reviewId) {
    const result = await deleteHospitalReviewRequest(hospitalId, reviewId)
    if (result.success) updateHospitalReviewSummary(hospitalId, result.summary)
    return result
  }

  onScopeDispose(() => {
    mapRequestId += 1
    mapRequestController?.abort()
    mapRequestController = null
  })

  return {
    hospitals, visibleHospitals, mapHospitals, markerHospitals, regions, availableDistricts,
    pagination, filters, mode, selectedHospitalId, selectedHospital, isLoading, mapLoading,
    regionsLoading, errorMessage, mapError, regionsError, mapTruncated, locationFallbackMessage,
    hasRealLocation, isEmpty, enterHospitalPage, queueHospitalEntrySelection,
    loadHospitals, loadNearbyHospitals, loadMapHospitals, loadRegions,
    setKeyword, setLocationFilter, set24H, setFavoritesOnly, setSort, setPage, clearFilters,
    selectHospital, retryCurrentQuery, retryMapQuery, updateHospitalReviewSummary, getHospitalById,
    loadHospitalReviews, submitHospitalReview, updateHospitalReview, deleteHospitalReview,
    toggleFavoriteHospital,
  }
})
