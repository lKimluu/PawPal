<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import SearchBar from '@/components/hospital/SearchBar.vue'
import MapView from '@/components/hospital/MapView.vue'
import HospitalList from '@/components/hospital/HospitalList.vue'
import { useAuthStore } from '@/stores/auth.js'
import { useHospitalStore } from '@/stores/hospital.js'
import { useLocationStore } from '@/stores/location.js'

const authStore = useAuthStore()
const locationStore = useLocationStore()
const hospitalStore = useHospitalStore()
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
  locationFallbackMessage,
} = storeToRefs(hospitalStore)
const headerVariant = computed(() => (authStore.isLoggedIn ? 'member' : 'public'))
const isLocationPermissionBlocked = computed(() => permissionState.value === 'denied')

async function requestCurrentLocation() {
  await locationStore.requestCurrentLocation()

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
              <p v-if="locationFallbackMessage" class="mt-1 text-xs text-brand-orange">
                {{ locationFallbackMessage }}
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
            <MapView
              class="min-w-0"
              :hospitals="mapHospitals"
              :selected-hospital-id="selectedHospitalId"
              :selected-hospital="selectedHospital"
              :user-location="userLocation"
              :is-loading="mapLoading"
              :error-message="mapError"
              :is-truncated="mapTruncated"
              @bounds-change="hospitalStore.loadMapHospitals"
              @retry="hospitalStore.retryMapQuery"
              @select-hospital="selectHospital"
            />

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
                @select-hospital="selectHospital"
                @retry="hospitalStore.retryCurrentQuery"
                @page-change="hospitalStore.setPage"
              />
            </aside>
          </div>
        </section>
      </main>
    </div>
    <AppFooter class="lg:hidden" />
  </div>
</template>
