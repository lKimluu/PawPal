import L from 'leaflet'
import { buildHospitalPopupHtml } from '@/utils/hospitalPopup.js'

export function createUserLocationIcon() {
  return L.divIcon({
    className: 'user-location-marker-icon',
    html: '<span class="user-location-marker-halo"><span class="user-location-marker-pin"></span></span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  })
}

export function createHospitalMarkerIcon(hospital = {}) {
  return L.divIcon({
    className: 'hospital-marker-icon',
    html: `<span class="hospital-marker-pin hospital-marker--map ${hospital.is24H ? 'hospital-marker--map-emergency' : ''}"><span class="hospital-marker-symbol">+</span></span>`,
    iconSize: [38, 46],
    iconAnchor: [19, 44],
    popupAnchor: [0, -42],
  })
}

export function createHospitalMarker(hospital, onSelect) {
  const marker = L.marker([hospital.latitude, hospital.longitude], {
    icon: createHospitalMarkerIcon(hospital),
  })

  marker.bindPopup(buildHospitalPopupHtml(hospital), { minWidth: 244, maxWidth: 280 })
  marker.on('click', () => onSelect?.(hospital))

  return marker
}
