<script setup>
import { computed } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { hospitals as defaultHospitals } from '@/data/hospitals.js'
import HospitalMarker from '@/components/hospital/HospitalMarker.vue'

const props = defineProps({
  hospitals: {
    type: Array,
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

const center = computed(() => {
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
      <h2 class="mt-1 text-lg font-bold text-brand-navy md:text-xl">附近動物醫院</h2>

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

    <div class="relative h-[430px] w-full bg-brand-lightblue/40 md:h-[540px]">
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
</style>
