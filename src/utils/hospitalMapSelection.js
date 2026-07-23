const MIN_HOSPITAL_ZOOM = 15

function hasValidCoordinates(hospital) {
  return Number.isFinite(hospital?.latitude) && Number.isFinite(hospital?.longitude)
}

export function resolveHospitalMapInitialCenter({
  selectedHospital,
  userLocation,
  hospitals = [],
  fallbackCenter,
}) {
  if (hasValidCoordinates(selectedHospital)) {
    return [selectedHospital.latitude, selectedHospital.longitude]
  }

  if (Number.isFinite(userLocation?.lat) && Number.isFinite(userLocation?.lng)) {
    return [userLocation.lat, userLocation.lng]
  }

  const validHospitals = hospitals.filter(hasValidCoordinates)
  if (validHospitals.length === 0) return fallbackCenter

  const totals = validHospitals.reduce(
    (sum, hospital) => ({
      latitude: sum.latitude + hospital.latitude,
      longitude: sum.longitude + hospital.longitude,
    }),
    { latitude: 0, longitude: 0 },
  )

  return [
    totals.latitude / validHospitals.length,
    totals.longitude / validHospitals.length,
  ]
}

export function createMapBoundsScheduler({
  onBounds,
  delay = 300,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let timerId

  function schedule() {
    if (timerId !== undefined) clearTimer(timerId)
    timerId = setTimer(() => {
      timerId = undefined
      onBounds()
    }, delay)
  }

  function cancel() {
    if (timerId !== undefined) clearTimer(timerId)
    timerId = undefined
  }

  return { schedule, cancel }
}

export function createSpiderfyPopupSyncGuard({ onDeferredSync }) {
  let pendingMarker = null
  let popupCloseHandler = null

  function cancel() {
    if (pendingMarker && popupCloseHandler) {
      pendingMarker.off('popupclose', popupCloseHandler)
    }
    pendingMarker = null
    popupCloseHandler = null
  }

  function deferIfNeeded(marker, { restoreOpenPopup = true } = {}) {
    const shouldDefer =
      restoreOpenPopup &&
      Boolean(marker?._preSpiderfyLatlng) &&
      Boolean(marker?.isPopupOpen?.())

    if (!shouldDefer) return false
    if (pendingMarker === marker && popupCloseHandler) return true

    cancel()
    pendingMarker = marker
    popupCloseHandler = () => {
      cancel()
      onDeferredSync({ restoreOpenPopup: false })
    }
    marker.once('popupclose', popupCloseHandler)
    return true
  }

  return { deferIfNeeded, cancel }
}

export function revealHospitalClusterMarker({
  clusterLayer,
  marker,
  isCurrentMarker,
  onPopupOpen,
}) {
  let isActive = true
  let animationEndHandler = null

  function handlePopupOpen() {
    if (!isActive) return
    isActive = false
    marker.off('popupopen', handlePopupOpen)
    onPopupOpen()
  }

  function revealWhenClusterSettles() {
    if (!isActive) return
    if (clusterLayer._inZoomAnimation > 0) {
      animationEndHandler = () => {
        animationEndHandler = null
        revealWhenClusterSettles()
      }
      clusterLayer.once('animationend', animationEndHandler)
      return
    }

    marker.once('popupopen', handlePopupOpen)
    clusterLayer.zoomToShowLayer(marker, () => {
      if (!isActive || !isCurrentMarker()) return
      marker.openPopup()
      if (marker.isPopupOpen()) handlePopupOpen()
    })
  }

  revealWhenClusterSettles()

  return () => {
    isActive = false
    if (animationEndHandler) clusterLayer.off('animationend', animationEndHandler)
    marker.off('popupopen', handlePopupOpen)
  }
}

export function createHospitalMapSelectionCoordinator({
  getMap,
  isAtTarget,
  syncClusters,
  revealMarker,
  beforeProgrammaticMove = () => {},
}) {
  let generation = 0
  let isFocusing = false
  let syncQueued = false
  let pendingMoveEnd = null
  let cancelReveal = null

  function cancelPendingWork() {
    const map = getMap()
    if (pendingMoveEnd && map) map.off('moveend', pendingMoveEnd)
    pendingMoveEnd = null
    cancelReveal?.()
    cancelReveal = null
  }

  function completeFocus(requestGeneration) {
    if (requestGeneration !== generation) return

    pendingMoveEnd = null
    cancelReveal = null
    isFocusing = false
    if (!syncQueued) return

    syncQueued = false
    syncClusters({ restoreOpenPopup: true })
  }

  function revealSelection(hospitalId, requestGeneration) {
    if (requestGeneration !== generation) return
    const cancel = revealMarker(hospitalId, () => completeFocus(requestGeneration))
    cancelReveal = typeof cancel === 'function' ? cancel : null
  }

  function focus(hospital) {
    generation += 1
    const requestGeneration = generation
    const map = getMap()
    const hasFocusTarget = Boolean(map && hasValidCoordinates(hospital))
    const hasPendingMovement = Boolean(pendingMoveEnd)
    const shouldFlushQueuedSync = syncQueued && !hasFocusTarget

    cancelPendingWork()
    isFocusing = false
    syncQueued = false
    if (!hasFocusTarget) {
      if (hasPendingMovement) map?.stop?.()
      if (shouldFlushQueuedSync) syncClusters({ restoreOpenPopup: true })
      return false
    }

    map.stop?.()
    beforeProgrammaticMove()
    syncClusters({ restoreOpenPopup: false })
    isFocusing = true

    const targetZoom = Math.max(map.getZoom(), MIN_HOSPITAL_ZOOM)
    if (isAtTarget(map, hospital, targetZoom)) {
      revealSelection(hospital.id, requestGeneration)
      return false
    }

    pendingMoveEnd = () => {
      pendingMoveEnd = null
      revealSelection(hospital.id, requestGeneration)
    }
    map.once('moveend', pendingMoveEnd)
    map.flyTo([hospital.latitude, hospital.longitude], targetZoom)
    return true
  }

  function requestClusterSync() {
    if (isFocusing) {
      syncQueued = true
      return
    }

    syncClusters({ restoreOpenPopup: true })
  }

  function destroy() {
    generation += 1
    cancelPendingWork()
    isFocusing = false
    syncQueued = false
  }

  return { focus, requestClusterSync, destroy }
}
