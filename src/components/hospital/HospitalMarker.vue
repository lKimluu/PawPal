<script setup>
import { computed } from 'vue'
import { LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'

const props = defineProps({
  hospital: {
    type: Object,
    required: true,
  },
})

const position = computed(() => [props.hospital.lat, props.hospital.lng])
const statusLabel = computed(() => (props.hospital.isOpen ? '營業中' : '休息中'))
const statusClass = computed(() =>
  props.hospital.isOpen ? 'bg-brand-lightblue text-brand-blue' : 'bg-gray-100 text-brand-gray',
)
const markerIcon = computed(() => {
  const stateClass = props.hospital.isOpen ? 'hospital-marker--open' : 'hospital-marker--closed'
  const emergencyClass = props.hospital.is24H ? 'hospital-marker--emergency' : ''

  return L.divIcon({
    className: 'hospital-marker-icon',
    html: `
      <span class="hospital-marker-pin ${stateClass} ${emergencyClass}">
        <span class="hospital-marker-symbol">+</span>
      </span>
    `,
    iconSize: [38, 46],
    iconAnchor: [19, 42],
    popupAnchor: [0, -38],
  })
})
</script>

<template>
  <LMarker :lat-lng="position" :icon="markerIcon">
    <LPopup>
      <article class="hospital-popup min-w-[230px] text-brand-navy">
        <div class="mb-3 flex items-start justify-between gap-3">
          <h3 class="max-w-[145px] text-[15px] font-bold leading-snug">
            {{ hospital.name }}
          </h3>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
            :class="statusClass"
          >
            {{ statusLabel }}
          </span>
        </div>

        <dl class="space-y-2 text-xs leading-relaxed text-brand-gray">
          <div class="rounded-xl bg-brand-lightblue/45 px-3 py-2">
            <dt class="sr-only">地址</dt>
            <dd class="text-brand-navy">{{ hospital.address }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="sr-only">營業時間</dt>
            <dd>{{ hospital.businessHours }}</dd>
            <dd
              v-if="hospital.is24H"
              class="rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-bold text-white"
            >
              24H
            </dd>
          </div>
          <div class="flex items-center gap-1.5">
            <dt class="sr-only">評分</dt>
            <dd class="text-brand-orange">★</dd>
            <dd class="font-bold text-brand-navy">{{ hospital.rating.toFixed(1) }}</dd>
            <dd class="text-brand-gray">({{ hospital.reviewCount }} 則評論)</dd>
          </div>
        </dl>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="category in hospital.categories"
            :key="category"
            class="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-brand-blue ring-1 ring-brand-lightblue"
          >
            {{ category }}
          </span>
        </div>
      </article>
    </LPopup>
  </LMarker>
</template>

<style>
.hospital-marker-icon {
  background: transparent;
  border: 0;
}

.hospital-marker-pin {
  position: relative;
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 3px solid #ffffff;
  border-radius: 999px 999px 999px 6px;
  box-shadow: 0 12px 24px rgba(61, 74, 122, 0.22);
  transform: rotate(-45deg);
}

.hospital-marker-pin::after {
  position: absolute;
  right: -1px;
  top: -1px;
  width: 10px;
  height: 10px;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: #ffa002;
  content: '';
  opacity: 0;
}

.hospital-marker--emergency::after {
  opacity: 1;
}

.hospital-marker--open {
  background: #92a8f5;
}

.hospital-marker--closed {
  background: #9ca3af;
}

.hospital-marker-symbol {
  color: #ffffff;
  font-size: 21px;
  font-weight: 800;
  line-height: 1;
  transform: rotate(45deg) translateY(-1px);
}

.leaflet-popup-content-wrapper {
  border-radius: 18px;
  box-shadow: 0 18px 45px rgba(61, 74, 122, 0.2);
}

.leaflet-popup-content {
  margin: 14px;
}

.leaflet-popup-tip {
  box-shadow: 0 10px 24px rgba(61, 74, 122, 0.16);
}
</style>
