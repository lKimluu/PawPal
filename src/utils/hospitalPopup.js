export function escapeHospitalPopupText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function telephoneHref(phone) {
  const sanitized = String(phone ?? '').replace(/[^0-9+*#,;pwPW]/g, '')
  return sanitized ? `tel:${encodeURIComponent(sanitized)}` : ''
}

function googleMapsDirectionsHref(hospital) {
  const latitude = Number(hospital.latitude)
  const longitude = Number(hospital.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return ''
  const destination = encodeURIComponent(`${latitude},${longitude}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}

export function buildHospitalPopupHtml(hospital = {}) {
  const name = escapeHospitalPopupText(hospital.name || '未知醫院')
  const address = escapeHospitalPopupText(hospital.address || '地址資訊未提供')
  const hospitalId = escapeHospitalPopupText(hospital.id)
  const rating = Number(hospital.rating ?? hospital.average_rating ?? 0).toFixed(1)
  const reviewCount = Number(hospital.reviewCount ?? hospital.review_count ?? 0)
  const phoneHref = telephoneHref(hospital.phone)
  const directionsHref = googleMapsDirectionsHref(hospital).replaceAll('&', '&amp;')
  const badge = hospital.is24H ? '<span class="hospital-popup-card__badge">24H</span>' : ''
  const phoneAction = phoneHref
    ? `<a class="hospital-popup-card__action hospital-popup-card__action--secondary" href="${phoneHref}">撥打電話</a>`
    : ''
  const directionsAction = directionsHref
    ? `<a class="hospital-popup-card__action hospital-popup-card__action--primary" href="${directionsHref}" target="_blank" rel="noopener noreferrer">Google Maps 導航</a>`
    : ''
  const reviewButton = `<button class="hospital-popup-card__rating" type="button" data-hospital-review-id="${hospitalId}">
      <span aria-hidden="true">★</span>
      <span>${rating}</span>
      <span>（${reviewCount} 則評論）</span>
    </button>`

  return `<div class="hospital-popup-layout">
    <div class="hospital-popup-card__heading">
      <h3 class="hospital-popup-card__title">${name}</h3>
      ${badge}
    </div>
    ${reviewButton}
    <p class="hospital-popup-card__address">${address}</p>
    <div class="hospital-popup-card__actions">${phoneAction}${directionsAction}</div>
  </div>`
}
