<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import SearchBar from '@/components/hospital/SearchBar.vue'
import MapView from '@/components/hospital/MapView.vue'
import HospitalList from '@/components/hospital/HospitalList.vue'
import { useAuthStore } from '@/stores/auth.js'
import { useLocationStore } from '@/stores/location.js'

const authStore = useAuthStore()
const locationStore = useLocationStore()
const { userLocation, isLocating, locationError, permissionState } = storeToRefs(locationStore)
const headerVariant = computed(() => (authStore.isLoggedIn ? 'member' : 'public'))
const isLocationPermissionBlocked = computed(() => permissionState.value === 'denied')
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
                <span v-else>取得目前位置後，地圖會移到你的所在地。</span>
              </p>
              <p v-if="isLocationPermissionBlocked" class="mt-1 text-xs text-brand-gray">
                請從瀏覽器網址列或網站設定允許 PawPal 使用定位，再重新檢查定位權限。
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center rounded-full bg-brand-blue px-5 text-sm font-bold text-white transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:bg-brand-gray"
              :disabled="isLocating"
              @click="locationStore.requestCurrentLocation()"
            >
              {{
                isLocating
                  ? '定位中...'
                  : isLocationPermissionBlocked
                    ? '重新檢查定位權限'
                    : '重新取得目前位置'
              }}
            </button>
          </div>
          <div class="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <MapView class="min-w-0" :user-location="userLocation" />

            <aside class="flex min-w-0 flex-col gap-5 xl:max-h-[760px]">
              <SearchBar />
              <HospitalList class="min-h-[460px] xl:min-h-0 xl:flex-1" />
            </aside>
          </div>
        </section>
      </main>
    </div>
    <AppFooter class="lg:hidden" />
  </div>
</template>
