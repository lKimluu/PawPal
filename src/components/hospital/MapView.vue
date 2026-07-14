<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { LMap, LMarker, LPopup, LTileLayer } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import MapStatusOverlay from '@/components/hospital/MapStatusOverlay.vue'
import { TAIPEI_CENTER } from '@/api/hospitals.js'
import { createHospitalMarker, createUserLocationIcon } from '@/utils/hospitalMapMarkers.js'
import {
  createHospitalMapSelectionCoordinator,
  createMapBoundsScheduler,
  createSpiderfyPopupSyncGuard,
  resolveHospitalMapInitialCenter,
  revealHospitalClusterMarker,
} from '@/utils/hospitalMapSelection.js'

const props = defineProps({
  hospitals: {
    type: Array,
    default: () => [],
  },
  selectedHospitalId: {
    type: [String, Number],
    default: null,
  },
  selectionRequestId: {
    type: Number,
    default: 0,
  },
  userLocation: {
    type: Object,
    default: null,
  },
  selectedHospital: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  isTruncated: { type: Boolean, default: false },
})

const emit = defineEmits(['selectHospital', 'boundsChange', 'retry'])
const mapObject = ref(null)
let clusterLayer
let pendingLocationPosition = null
const markerById = new Map()

function hasValidHospitalCoordinates(hospital) {
  return Number.isFinite(hospital?.latitude) && Number.isFinite(hospital?.longitude)
}

const validHospitals = computed(() => {
  const merged = [...props.hospitals]
  if (props.selectedHospital && !merged.some((item) => item.id === props.selectedHospital.id))
    merged.push(props.selectedHospital)
  return merged.filter(hasValidHospitalCoordinates)
})
const emergencyCount = computed(
  () => validHospitals.value.filter((hospital) => hospital.is24H).length,
)
const isValidUserLocation = computed(
  () =>
    props.userLocation &&
    Number.isFinite(props.userLocation.lat) &&
    Number.isFinite(props.userLocation.lng),
)
const userPosition = computed(() =>
  isValidUserLocation.value ? [props.userLocation.lat, props.userLocation.lng] : null,
)
const selectedHospital = computed(() =>
  validHospitals.value.find((hospital) => hospital.id === props.selectedHospitalId),
)
const userLocationIcon = createUserLocationIcon()
const initialCenter = ref(
  resolveHospitalMapInitialCenter({
    selectedHospital: selectedHospital.value,
    userLocation: props.userLocation,
    hospitals: validHospitals.value,
    fallbackCenter: TAIPEI_CENTER,
  }),
)

function emitBounds() {
  const bounds = mapObject.value?.getBounds()
  if (!bounds) return
  emit('boundsChange', {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  })
}
const boundsScheduler = createMapBoundsScheduler({ onBounds: emitBounds })
const scheduleBounds = boundsScheduler.schedule
function revealHospitalMarker(hospitalId, onPopupOpen) {
  const marker = markerById.get(hospitalId)
  if (!marker || !clusterLayer) {
    onPopupOpen()
    return undefined
  }

  return revealHospitalClusterMarker({
    clusterLayer,
    marker,
    isCurrentMarker: () => markerById.get(hospitalId) === marker,
    onPopupOpen,
  })
}
function openMarkerPopupWithoutAutoPan(marker) {
  const popup = marker?.getPopup()
  if (!popup) return

  const originalAutoPan = popup.options.autoPan
  popup.options.autoPan = false
  marker.openPopup()
  popup.options.autoPan = originalAutoPan
}
function rebuildClusters({ restoreOpenPopup = true } = {}) {
  if (!mapObject.value) return
  if (!clusterLayer) {
    clusterLayer = L.markerClusterGroup()
    clusterLayer.addTo(mapObject.value)
  }
  const selectedMarker = markerById.get(props.selectedHospitalId)
  const shouldRestoreSelectedPopup =
    restoreOpenPopup && Boolean(selectedMarker?.isPopupOpen())
  clusterLayer.clearLayers()
  markerById.clear()
  for (const hospital of validHospitals.value) {
    const marker = createHospitalMarker(hospital, (selected) => emit('selectHospital', selected.id))
    markerById.set(hospital.id, marker)
    clusterLayer.addLayer(marker)
  }

  if (shouldRestoreSelectedPopup) {
    nextTick(() => openMarkerPopupWithoutAutoPan(markerById.get(props.selectedHospitalId)))
  }
}

const spiderfyPopupSyncGuard = createSpiderfyPopupSyncGuard({
  onDeferredSync: rebuildClusters,
})

function syncClusters(options = {}) {
  const selectedMarker = markerById.get(props.selectedHospitalId)
  if (spiderfyPopupSyncGuard.deferIfNeeded(selectedMarker, options)) return

  spiderfyPopupSyncGuard.cancel()
  rebuildClusters(options)
}

function isMapAtHospital(map, hospital, targetZoom) {
  return (
    map.getZoom() >= targetZoom &&
    map.distance(map.getCenter(), [hospital.latitude, hospital.longitude]) <= 1
  )
}

const selectionCoordinator = createHospitalMapSelectionCoordinator({
  getMap: () => mapObject.value,
  isAtTarget: isMapAtHospital,
  syncClusters,
  revealMarker: revealHospitalMarker,
})

function focusSelectedHospital() {
  selectionCoordinator.focus(selectedHospital.value)
}
function panToPendingLocation() {
  if (!mapObject.value || !pendingLocationPosition || props.selectedHospitalId !== null) return

  const [latitude, longitude] = pendingLocationPosition
  pendingLocationPosition = null
  mapObject.value.closePopup()
  mapObject.value.panTo([latitude, longitude])
}
function onMapReady(map) {
  mapObject.value = map
  if (selectedHospital.value) {
    focusSelectedHospital()
  } else {
    syncClusters()
    scheduleBounds()
  }
}
watch(validHospitals, () => nextTick(selectionCoordinator.requestClusterSync), { deep: true })
watch(
  () => [props.selectedHospitalId, props.selectionRequestId, props.selectedHospital],
  () => nextTick(focusSelectedHospital),
)
watch(
  () => props.userLocation,
  (location) => {
    if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return
    pendingLocationPosition = [location.lat, location.lng]
    nextTick(panToPendingLocation)
  },
)
watch(
  () => props.selectedHospitalId,
  () => nextTick(panToPendingLocation),
)
onBeforeUnmount(() => {
  boundsScheduler.cancel()
  selectionCoordinator.destroy()
  spiderfyPopupSyncGuard.cancel()
  if (clusterLayer && mapObject.value) mapObject.value.removeLayer(clusterLayer)
})
</script>

<template>
  <section
    class="overflow-hidden rounded-3xl border border-brand-lightblue bg-brand-white shadow-[0_16px_45px_rgba(61,74,122,0.12)]"
  >
    <div
      class="flex flex-col gap-4 border-b border-brand-lightblue bg-white px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6"
    >
      <div>
        <h2 class="mt-1 text-lg font-bold text-brand-navy md:text-xl">醫院地圖</h2>
        <p class="mt-1 text-sm leading-6 text-brand-gray">
          移動或縮放地圖，即時查看目前範圍內的動物醫院與 24 小時營業資訊。
        </p>
      </div>

      <dl class="grid grid-cols-2 gap-2 text-center">
        <div class="rounded-2xl bg-brand-lightblue/60 px-3 py-2">
          <dt class="text-[11px] font-medium text-brand-gray">醫院</dt>
          <dd class="text-base font-bold text-brand-navy">{{ validHospitals.length }}</dd>
        </div>
        <div class="rounded-2xl bg-orange-50 px-3 py-2">
          <dt class="text-[11px] font-medium text-brand-gray">24H</dt>
          <dd class="text-base font-bold text-brand-orange">{{ emergencyCount }}</dd>
        </div>
      </dl>
    </div>

    <div class="relative h-[520px] w-full bg-brand-lightblue/40 md:h-[680px]">
      <LMap
        :zoom="13"
        :center="initialCenter"
        :zoom-control="false"
        class="hospital-map h-full w-full"
        @ready="onMapReady"
        @moveend="scheduleBounds"
        @zoomend="scheduleBounds"
      >
        <LTileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        <LMarker v-if="userPosition" :lat-lng="userPosition" :icon="userLocationIcon">
          <LPopup :options="{ closeButton: false }">
            <div class="px-1 py-0.5 text-sm font-bold text-brand-navy">你目前的位置</div>
          </LPopup>
        </LMarker>
      </LMap>
      <MapStatusOverlay
        :is-loading="isLoading"
        :error-message="errorMessage"
        :is-truncated="isTruncated"
        @retry="emit('retry')"
      />
    </div>
  </section>
</template>
