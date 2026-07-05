<script setup>
import { computed } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import SearchBar from '@/components/hospital/SearchBar.vue'
import MapView from '@/components/hospital/MapView.vue'
import HospitalList from '@/components/hospital/HospitalList.vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const headerVariant = computed(() => (authStore.isLoggedIn ? 'member' : 'public'))
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
          <div class="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <MapView class="min-w-0" />

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
