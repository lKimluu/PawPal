import { defineStore } from 'pinia'
import { ref } from 'vue'

const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
}

const GEOLOCATION_ERROR_MESSAGES = {
  1: '定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試',
  2: '目前無法取得位置，請稍後再試',
  3: '定位逾時，請重新取得目前位置',
}

const UNSUPPORTED_GEOLOCATION_MESSAGE = '此瀏覽器不支援定位功能'
const UNKNOWN_GEOLOCATION_ERROR_MESSAGE = '定位失敗，請稍後再試'

export const useLocationStore = defineStore('location', () => {
  const userLocation = ref(null)
  const isLocating = ref(false)
  const locationError = ref('')
  const hasRequestedLocation = ref(false)
  const permissionState = ref('unknown')
  let pendingLocationRequest = null

  function clearLocationError() {
    locationError.value = ''
  }

  async function refreshPermissionState() {
    if (!navigator?.permissions?.query) {
      permissionState.value = 'unsupported'
      return permissionState.value
    }

    try {
      const status = await navigator.permissions.query({ name: 'geolocation' })
      permissionState.value = status.state

      status.onchange = () => {
        permissionState.value = status.state
      }

      return status.state
    } catch {
      permissionState.value = 'unknown'
      return permissionState.value
    }
  }

  function requestCurrentLocation() {
    if (isLocating.value && pendingLocationRequest) {
      return pendingLocationRequest
    }

    hasRequestedLocation.value = true
    clearLocationError()

    if (!navigator?.geolocation?.getCurrentPosition) {
      locationError.value = UNSUPPORTED_GEOLOCATION_MESSAGE
      return Promise.resolve(false)
    }

    isLocating.value = true

    pendingLocationRequest = resolveCurrentLocation()

    return pendingLocationRequest
  }

  async function resolveCurrentLocation() {
    const state = await refreshPermissionState()

    if (state === 'denied') {
      locationError.value = GEOLOCATION_ERROR_MESSAGES[1]
      isLocating.value = false
      pendingLocationRequest = null
      return false
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          clearLocationError()
          isLocating.value = false
          pendingLocationRequest = null
          resolve(true)
        },
        (error = {}) => {
          locationError.value =
            GEOLOCATION_ERROR_MESSAGES[error.code] || UNKNOWN_GEOLOCATION_ERROR_MESSAGE
          isLocating.value = false
          pendingLocationRequest = null
          resolve(false)
        },
        LOCATION_OPTIONS,
      )
    })
  }

  return {
    userLocation,
    isLocating,
    locationError,
    hasRequestedLocation,
    permissionState,
    requestCurrentLocation,
    refreshPermissionState,
    clearLocationError,
  }
})
