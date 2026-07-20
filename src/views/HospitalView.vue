<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import SearchBar from '@/components/hospital/SearchBar.vue'
import MapView from '@/components/hospital/MapView.vue'
import HospitalList from '@/components/hospital/HospitalList.vue'
import HospitalReviewModal from '@/components/hospital/HospitalReviewModal.vue'
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal.vue'
import { useAuthStore } from '@/stores/auth.js'
import { useHospitalStore } from '@/stores/hospital.js'
import { useLocationStore } from '@/stores/location.js'
import { useToastStore } from '@/stores/toast.js'

const authStore = useAuthStore()
const locationStore = useLocationStore()
const hospitalStore = useHospitalStore()
const toastStore = useToastStore()
const { userLocation, isLocating, locationError, permissionState } = storeToRefs(locationStore)
const {
  visibleHospitals,
  mapHospitals,
  pagination,
  mapLoading,
  mapError,
  mapTruncated,
  selectedHospitalId,
  selectedHospital,
  isLoading,
  errorMessage,
} = storeToRefs(hospitalStore)
const headerVariant = computed(() => (authStore.isLoggedIn ? 'member' : 'public'))
const isLocationPermissionBlocked = computed(() => permissionState.value === 'denied')
const isReviewModalOpen = ref(false)
const reviewHospital = ref(null)
const reviewMode = ref('list')
const reviewList = ref([])
const isReviewLoading = ref(false)
const isReviewSubmitting = ref(false)
const editingReview = ref(null)
const reviewToDelete = ref(null)
const isReviewDeleteOpen = ref(false)
const isReviewDeleting = ref(false)
const currentUserId = computed(() => authStore.user?.id ?? authStore.user?.user_id ?? null)
const selectionRequestId = ref(0)
const mapSectionRef = ref(null)
const stackedHospitalMapQuery = '(max-width: 1279px)'
const reviewRequestToken = ref(0)

async function requestCurrentLocation() {
  const locationSucceeded = await locationStore.requestCurrentLocation()

  if (locationSucceeded) {
    hospitalStore.selectHospital(null)
  }

  return hospitalStore.loadNearbyHospitals({
    location: userLocation.value,
    locationError: locationError.value,
  })
}

async function loadNearbyHospitals({ requestLocation = true } = {}) {
  if (!userLocation.value) {
    if (requestLocation) {
      await locationStore.requestCurrentLocation()
    }
  }

  return hospitalStore.loadNearbyHospitals({
    location: userLocation.value,
    locationError: locationError.value,
  })
}

function selectHospital(hospitalId) {
  hospitalStore.selectHospital(hospitalId)
  selectionRequestId.value += 1
}

function isStackedHospitalMapLayout() {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(stackedHospitalMapQuery).matches
  }
  return window.innerWidth <= 1279
}

function scrollMapIntoViewOnStackedLayout() {
  if (!isStackedHospitalMapLayout()) return

  nextTick(() => {
    mapSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function selectHospitalFromList(hospitalId) {
  selectHospital(hospitalId)
  scrollMapIntoViewOnStackedLayout()
}

function isCurrentReviewRequest(hospitalId, requestToken) {
  return (
    isReviewModalOpen.value &&
    reviewRequestToken.value === requestToken &&
    String(reviewHospital.value?.id) === String(hospitalId)
  )
}

async function openHospitalReviewModal(hospital) {
  const requestToken = ++reviewRequestToken.value
  reviewHospital.value = hospital
  reviewMode.value = 'list'
  reviewList.value = []
  isReviewModalOpen.value = true
  await reloadHospitalReviews(hospital.id, requestToken)
}

async function reloadHospitalReviews(hospitalId, requestToken = reviewRequestToken.value) {
  isReviewLoading.value = true
  const result = await hospitalStore.loadHospitalReviews(hospitalId)

  if (!isCurrentReviewRequest(hospitalId, requestToken)) return result

  isReviewLoading.value = false
  const latestHospital = hospitalStore.getHospitalById(hospitalId)
  if (latestHospital) reviewHospital.value = latestHospital
  if (result.success) reviewList.value = result.reviews
  if (!result.success) toastStore.showToast(result.message, 'error')
  return result
}

function closeHospitalReviewModal() {
  reviewRequestToken.value += 1
  isReviewModalOpen.value = false
  reviewMode.value = 'list'
  reviewHospital.value = null
  reviewList.value = []
  isReviewLoading.value = false
  isReviewSubmitting.value = false
  editingReview.value = null
  reviewToDelete.value = null
  isReviewDeleteOpen.value = false
  isReviewDeleting.value = false
}

function showReviewForm() {
  editingReview.value = null
  reviewMode.value = 'form'
}

function backToReviewList() {
  editingReview.value = null
  reviewMode.value = 'list'
}

function startEditReview(review) {
  editingReview.value = review
  reviewMode.value = 'form'
}

function openReviewDeleteConfirm(review) {
  reviewToDelete.value = review
  isReviewDeleteOpen.value = true
}

function closeReviewDeleteConfirm() {
  isReviewDeleteOpen.value = false
  reviewToDelete.value = null
}

async function submitHospitalReview(payload) {
  if (!reviewHospital.value || isReviewSubmitting.value) return

  if (!authStore.isLoggedIn) {
    toastStore.showToast('請先登入後再送出評論', 'error')
    return
  }

  const hospitalId = reviewHospital.value.id
  const reviewId = editingReview.value?.id
  const requestToken = reviewRequestToken.value
  isReviewSubmitting.value = true
  const result = reviewId
    ? await editHospitalReview(hospitalId, reviewId, payload)
    : await hospitalStore.submitHospitalReview(hospitalId, payload)

  if (!isCurrentReviewRequest(hospitalId, requestToken)) return

  isReviewSubmitting.value = false

  if (!result.success) {
    toastStore.showToast(result.message, 'error')
    return
  }

  const latestHospital = hospitalStore.getHospitalById(hospitalId)
  if (latestHospital) reviewHospital.value = latestHospital
  editingReview.value = null
  reviewMode.value = 'list'
  await reloadHospitalReviews(hospitalId, requestToken)
  if (!isCurrentReviewRequest(hospitalId, requestToken)) return
  toastStore.showToast(result.message || '評論已送出')
}

function editHospitalReview(hospitalId, reviewId, payload) {
  return hospitalStore.updateHospitalReview(hospitalId, reviewId, payload)
}

async function deleteHospitalReview() {
  if (!reviewHospital.value || !reviewToDelete.value || isReviewDeleting.value) return

  if (!authStore.isLoggedIn) {
    toastStore.showToast('請先登入後再刪除評論', 'error')
    return
  }

  const hospitalId = reviewHospital.value.id
  const reviewId = reviewToDelete.value.id
  const requestToken = reviewRequestToken.value
  isReviewDeleting.value = true
  const result = await hospitalStore.deleteHospitalReview(hospitalId, reviewId)

  if (!isCurrentReviewRequest(hospitalId, requestToken)) return

  isReviewDeleting.value = false

  if (!result.success) {
    toastStore.showToast(result.message, 'error')
    return
  }

  closeReviewDeleteConfirm()
  const latestHospital = hospitalStore.getHospitalById(hospitalId)
  if (latestHospital) reviewHospital.value = latestHospital
  await reloadHospitalReviews(hospitalId, requestToken)
  if (!isCurrentReviewRequest(hospitalId, requestToken)) return
  toastStore.showToast(result.message || '評論已刪除')
}

onMounted(() => {
  hospitalStore.loadRegions()
  loadNearbyHospitals({ requestLocation: false })
})
</script>

<template>
  <div class="min-h-screen bg-brand-white">
    <AppHeader :variant="headerVariant" />
    <div
      class="relative z-0 flex min-h-screen flex-col pt-14 lg:pt-17"
      :class="{ 'lg:pl-52': authStore.isLoggedIn }"
    >
      <main class="min-w-0 flex-1 px-4 py-6 md:px-8 lg:px-10">
        <section class="mx-auto flex w-full flex-col gap-5">
          <div
            class="flex flex-col gap-3 rounded-3xl border border-brand-lightblue bg-white px-4 py-4 shadow-[0_10px_30px_rgba(61,74,122,0.08)] md:flex-row md:items-center md:justify-between md:px-6"
          >
            <div>
              <p class="text-sm font-bold text-brand-navy">目前位置</p>
              <p class="mt-1 text-sm text-brand-gray" aria-live="polite">
                <span v-if="isLocating">定位中...</span>
                <span v-else-if="locationError" class="text-brand-orange">{{ locationError }}</span>
                <span v-else-if="userLocation">已取得目前位置</span>
                <span v-else>可使用目前位置搜尋附近醫院，若未取得定位會改用台北市中心。</span>
              </p>
              <p v-if="isLocationPermissionBlocked" class="mt-1 text-xs text-brand-gray">
                請從瀏覽器網址列或網站設定允許 PawPal 使用定位，再重新檢查定位權限。
              </p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-brand-blue ring-1 ring-brand-blue transition hover:bg-brand-lightblue active:scale-[0.98] active:bg-brand-lightblue disabled:cursor-not-allowed disabled:text-brand-gray disabled:ring-brand-gray disabled:active:scale-100"
                :disabled="isLocating"
                @click="requestCurrentLocation"
              >
                {{
                  isLocating
                    ? '定位中...'
                    : isLocationPermissionBlocked
                      ? '重新檢查定位權限'
                      : '重新取得目前位置'
                }}
              </button>
              <button
                type="button"
                class="inline-flex h-11 items-center justify-center rounded-full bg-brand-blue px-5 text-sm font-bold text-white transition hover:bg-brand-navy active:scale-[0.98] active:bg-brand-navy disabled:cursor-not-allowed disabled:bg-brand-gray disabled:active:scale-100"
                :disabled="isLocating || isLoading"
                @click="loadNearbyHospitals()"
              >
                {{ isLoading ? '查詢中...' : '搜尋附近醫院' }}
              </button>
            </div>
          </div>
          <div class="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div ref="mapSectionRef" class="min-w-0 scroll-mt-20">
              <MapView
                class="min-w-0"
                :hospitals="mapHospitals"
                :selected-hospital-id="selectedHospitalId"
                :selected-hospital="selectedHospital"
                :selection-request-id="selectionRequestId"
                :user-location="userLocation"
                :is-loading="mapLoading"
                :error-message="mapError"
                :is-truncated="mapTruncated"
                @bounds-change="hospitalStore.loadMapHospitals"
                @retry="hospitalStore.retryMapQuery"
                @select-hospital="selectHospital"
                @review-hospital="openHospitalReviewModal"
              />
            </div>

            <aside class="flex min-w-0 flex-col gap-5 xl:max-h-[760px]">
              <SearchBar />
              <HospitalList
                class="min-h-[460px] xl:min-h-0 xl:flex-1"
                :hospitals="visibleHospitals"
                :selected-hospital-id="selectedHospitalId"
                :is-loading="isLoading"
                :error-message="errorMessage"
                :is-empty="hospitalStore.isEmpty"
                :pagination="pagination"
                @select-hospital="selectHospitalFromList"
                @review-hospital="openHospitalReviewModal"
                @retry="hospitalStore.retryCurrentQuery"
                @page-change="hospitalStore.setPage"
              />
            </aside>
          </div>
        </section>
      </main>
    </div>
    <HospitalReviewModal
      :is-open="isReviewModalOpen"
      :hospital="reviewHospital"
      :mode="reviewMode"
      :reviews="reviewList"
      :is-loading="isReviewLoading"
      :is-submitting="isReviewSubmitting"
      :current-user-id="currentUserId"
      :editing-review="editingReview"
      @start-review="showReviewForm"
      @cancel-form="backToReviewList"
      @edit-review="startEditReview"
      @delete-review="openReviewDeleteConfirm"
      @close="closeHospitalReviewModal"
      @submit="submitHospitalReview"
    />
    <DeleteConfirmModal
      :is-open="isReviewDeleteOpen"
      title="確定刪除此則評論？"
      item-name="這則評論"
      :is-loading="isReviewDeleting"
      @close="closeReviewDeleteConfirm"
      @confirm="deleteHospitalReview"
    />
    <AppFooter class="lg:hidden" />
  </div>
</template>
