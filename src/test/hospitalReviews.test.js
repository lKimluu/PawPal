import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import axios from 'axios'

import {
  deleteHospitalReview,
  fetchHospitalReviews,
  normalizeHospital,
  submitHospitalReview,
  updateHospitalReview,
} from '../api/hospitals.js'
import { buildHospitalPopupHtml } from '../utils/hospitalPopup.js'

function readSource(path) {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

test('normalizeHospital accepts backend review summary fields', () => {
  const normalized = normalizeHospital({
    id: 7,
    name: '安心動物醫院',
    average_rating: '4.2',
    review_count: '89',
  })

  assert.equal(normalized.rating, 4.2)
  assert.equal(normalized.reviewCount, 89)
})

test('hospital review API fetches reviews and submits authenticated reviews', async () => {
  const originalGet = axios.get
  const originalPost = axios.post
  const originalPatch = axios.patch
  const originalDelete = axios.delete
  const calls = []

  globalThis.localStorage = {
    getItem(key) {
      return key === 'pawpal_token' ? 'token-123' : null
    },
  }

  axios.get = async (url) => {
    calls.push({ method: 'get', url })
    return {
      data: {
        summary: { average_rating: 4.2, review_count: 89 },
        reviews: [{ id: 1, rating: 4, comment: '醫師親切' }],
      },
    }
  }
  axios.post = async (url, data, config) => {
    calls.push({ method: 'post', url, data, config })
    return {
      data: {
        message: '評論已送出',
        review: { id: 2, rating: 5, comment: '環境乾淨' },
        summary: { average_rating: 4.3, review_count: 90 },
      },
    }
  }

  axios.patch = async (url, data, config) => {
    calls.push({ method: 'patch', url, data, config })
    return {
      data: {
        message: '評論已更新',
        review: { id: 2, rating: 4, comment: 'updated review' },
        summary: { average_rating: 4.1, review_count: 90 },
      },
    }
  }
  axios.delete = async (url, config) => {
    calls.push({ method: 'delete', url, config })
    return {
      data: {
        message: '評論已刪除',
        summary: { average_rating: 4.0, review_count: 89 },
      },
    }
  }

  try {
    assert.deepEqual(await fetchHospitalReviews(7), {
      success: true,
      summary: { average_rating: 4.2, review_count: 89 },
      reviews: [{ id: 1, rating: 4, comment: '醫師親切' }],
    })
    assert.deepEqual(await submitHospitalReview(7, { rating: 5, comment: '環境乾淨' }), {
      success: true,
      message: '評論已送出',
      review: { id: 2, rating: 5, comment: '環境乾淨' },
      summary: { average_rating: 4.3, review_count: 90 },
    })

    assert.deepEqual(await updateHospitalReview(7, 2, { rating: 4, comment: 'updated review' }), {
      success: true,
      message: '評論已更新',
      review: { id: 2, rating: 4, comment: 'updated review' },
      summary: { average_rating: 4.1, review_count: 90 },
    })
    assert.deepEqual(await deleteHospitalReview(7, 2), {
      success: true,
      message: '評論已刪除',
      summary: { average_rating: 4.0, review_count: 89 },
    })

    assert.equal(calls[0].url.endsWith('/api/v1/hospitals/7/reviews'), true)
    assert.equal(calls[1].url.endsWith('/api/v1/hospitals/7/reviews'), true)
    assert.deepEqual(calls[1].data, { rating: 5, comment: '環境乾淨' })
    assert.equal(calls[1].config.headers.Authorization, 'Bearer token-123')
    assert.equal(calls[2].url.endsWith('/api/v1/hospitals/7/reviews/2'), true)
    assert.deepEqual(calls[2].data, { rating: 4, comment: 'updated review' })
    assert.equal(calls[2].config.headers.Authorization, 'Bearer token-123')
    assert.equal(calls[3].url.endsWith('/api/v1/hospitals/7/reviews/2'), true)
    assert.equal(calls[3].config.headers.Authorization, 'Bearer token-123')
  } finally {
    axios.get = originalGet
    axios.post = originalPost
    axios.patch = originalPatch
    axios.delete = originalDelete
    delete globalThis.localStorage
  }
})

test('hospital popup renders a clickable review summary above address and actions', () => {
  const html = buildHospitalPopupHtml({
    id: 7,
    name: '安心動物醫院',
    address: '台北市大安區',
    rating: 4.2,
    reviewCount: 89,
    phone: '02-1234-5678',
    latitude: 25.033,
    longitude: 121.5654,
  })

  assert.match(html, /hospital-popup-card__address/)
  assert.match(html, /hospital-popup-card__rating/)
  assert.match(html, /data-hospital-review-id="7"/)
  assert.match(html, /4\.2/)
  assert.match(html, /89 則評論/)
  assert.ok(html.indexOf('hospital-popup-card__rating') < html.indexOf('hospital-popup-card__address'))
  assert.ok(html.indexOf('hospital-popup-card__rating') < html.indexOf('hospital-popup-card__actions'))
})

test('HospitalReviewModal uses BaseModal and disables submit until rating and comment are valid', () => {
  const modal = readSource('../components/hospital/HospitalReviewModal.vue')

  assert.match(modal, /import BaseModal from '@\/components\/common\/BaseModal\.vue'/)
  assert.match(modal, /import editIcon from '@\/assets\/icons\/edit_b\.svg'/)
  assert.match(modal, /import deleteIcon from '@\/assets\/icons\/delete_r\.svg'/)
  assert.match(modal, /<BaseModal[\s\S]*:is-open="isOpen"[\s\S]*@close="handleClose"/)
  assert.match(modal, /mode === 'list'/)
  assert.match(modal, /start-review/)
  assert.match(modal, /cancel-form/)
  assert.match(modal, /reviews/)
  assert.match(modal, /reviewUserName/)
  assert.match(modal, /formatReviewTime/)
  assert.match(modal, /normalizeReviewTimestamp/)
  assert.match(modal, /timeZone: 'Asia\/Taipei'/)
  assert.match(modal, /canManageReview/)
  assert.match(modal, /edit-review/)
  assert.match(modal, /delete-review/)
  assert.match(modal, /editingReview/)
  assert.match(modal, /儲存修改/)
  assert.match(modal, /v-for="star in 5"/)
  assert.match(modal, /hoverRating/)
  assert.match(modal, /activeRating/)
  assert.match(modal, /@mouseenter="hoverRating = star"/)
  assert.match(modal, /@mouseleave="hoverRating = 0"/)
  assert.match(modal, /activeRating >= star/)
  assert.match(modal, /comment\.value\.trim\(\)\.length > 0/)
  assert.match(modal, /:disabled="!canSubmit \|\| isSubmitting"/)
  assert.match(modal, /請輸入您對這間醫院的評論/)
})

test('HospitalView wires review modal to map popup and list card review events', () => {
  const hospitalView = readSource('../views/HospitalView.vue')
  const mapView = readSource('../components/hospital/MapView.vue')
  const hospitalList = readSource('../components/hospital/HospitalList.vue')
  const hospitalCard = readSource('../components/hospital/HospitalCard.vue')

  assert.match(hospitalView, /HospitalReviewModal/)
  assert.match(hospitalView, /openHospitalReviewModal/)
  assert.match(hospitalView, /reviewMode/)
  assert.match(hospitalView, /reviewList/)
  assert.match(hospitalView, /isReviewLoading/)
  assert.match(hospitalView, /reloadHospitalReviews/)
  assert.match(hospitalView, /submitHospitalReview/)
  assert.match(hospitalView, /editingReview/)
  assert.match(hospitalView, /reviewToDelete/)
  assert.match(hospitalView, /DeleteConfirmModal/)
  assert.match(hospitalView, /editHospitalReview/)
  assert.match(hospitalView, /deleteHospitalReview/)
  assert.match(hospitalView, /@review-hospital="openHospitalReviewModal"/)
  assert.match(hospitalView, /:mode="reviewMode"/)
  assert.match(hospitalView, /:reviews="reviewList"/)
  assert.match(hospitalView, /@start-review="showReviewForm"/)
  assert.match(hospitalView, /@cancel-form="backToReviewList"/)
  assert.match(hospitalView, /@edit-review="startEditReview"/)
  assert.match(hospitalView, /@delete-review="openReviewDeleteConfirm"/)
  assert.match(mapView, /reviewHospital/)
  assert.match(mapView, /hospital-popup-card__rating/)
  assert.match(hospitalList, /@review-hospital="emit\('reviewHospital', item\)"/)
  assert.match(hospitalCard, /defineEmits\(\['reviewHospital'\]\)/)
  assert.match(hospitalCard, /@click\.stop="emit\('reviewHospital'\)"/)
})
