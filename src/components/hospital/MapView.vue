<script setup>
import { computed } from 'vue'
import { LMap, LMarker, LPopup, LTileLayer } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { hospitals as defaultHospitals } from '@/data/hospitals.js'
import HospitalMarker from '@/components/hospital/HospitalMarker.vue'

const props = defineProps({
  hospitals: {
    type: Array,
    default: null,
  },
  userLocation: {
    type: Object,
    default: null,
  },
})

const TAIPEI_CENTER = [25.033, 121.5654]

const sourceHospitals = computed(() => props.hospitals ?? defaultHospitals)
const validHospitals = computed(() =>
  sourceHospitals.value.filter(
    (hospital) => Number.isFinite(hospital.lat) && Number.isFinite(hospital.lng),
  ),
)
const openCount = computed(() => validHospitals.value.filter((hospital) => hospital.isOpen).length)
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
const userLocationIcon = L.divIcon({
  className: 'user-location-marker-icon',
  html: '<span class="user-location-marker-halo"><span class="user-location-marker-pin"></span></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -14],
})

const center = computed(() => {
  if (userPosition.value) return userPosition.value
  if (validHospitals.value.length === 0) return TAIPEI_CENTER

  const total = validHospitals.value.reduce(
    (sum, hospital) => ({
      lat: sum.lat + hospital.lat,
      lng: sum.lng + hospital.lng,
    }),
    { lat: 0, lng: 0 },
  )

  return [total.lat / validHospitals.value.length, total.lng / validHospitals.value.length]
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
          查看附近動物醫院的位置、營業狀態與 24 小時急診資訊。
        </p>
      </div>

      <dl class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-2xl bg-brand-lightblue/60 px-3 py-2">
          <dt class="text-[11px] font-medium text-brand-gray">醫院</dt>
          <dd class="text-base font-bold text-brand-navy">{{ validHospitals.length }}</dd>
        </div>
        <div class="rounded-2xl bg-brand-lightblue/60 px-3 py-2">
          <dt class="text-[11px] font-medium text-brand-gray">營業中</dt>
          <dd class="text-base font-bold text-brand-blue">{{ openCount }}</dd>
        </div>
        <div class="rounded-2xl bg-orange-50 px-3 py-2">
          <dt class="text-[11px] font-medium text-brand-gray">24H</dt>
          <dd class="text-base font-bold text-brand-orange">{{ emergencyCount }}</dd>
        </div>
      </dl>
    </div>

    <div class="relative h-[520px] w-full bg-brand-lightblue/40 md:h-[680px]">
      <LMap :zoom="13" :center="center" :zoom-control="false" class="hospital-map h-full w-full">
        <LTileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        <HospitalMarker
          v-for="hospital in validHospitals"
          :key="hospital.id"
          :hospital="hospital"
        />
        <LMarker v-if="userPosition" :lat-lng="userPosition" :icon="userLocationIcon">
          <LPopup>
            <div class="px-1 py-0.5 text-sm font-bold text-brand-navy">你目前的位置</div>
          </LPopup>
        </LMarker>
      </LMap>
    </div>
  </section>
</template>

<style scoped>
:deep(.leaflet-container) {
  font-family: var(--font-brand-main);
}

:deep(.leaflet-control-attribution) {
  border-top-left-radius: 10px;
  color: #717182;
  font-size: 10px;
  padding: 2px 8px;
}

:deep(.user-location-marker-icon) {
  background: transparent;
  border: 0;
}

:deep(.user-location-marker-pin) {
  display: block;
  width: 16px;
  height: 16px;
  border: 3px solid #ffffff;
  border-radius: 999px;
  background: #92a8f5;
  box-shadow: 0 4px 12px rgba(61, 74, 122, 0.28);
}

:deep(.user-location-marker-halo) {
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(146, 168, 245, 0.42);
  border-radius: 999px;
  background: rgba(146, 168, 245, 0.18);
}
</style>
