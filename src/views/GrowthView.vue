<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import PetSwitcher from '@/components/pet/PetSwitcher.vue'
import GrowthRangeTabs from '@/components/growth/GrowthRangeTabs.vue'
import AddGrowthButton from '@/components/growth/AddGrowthButton.vue'
import GrowthChartCard from '@/components/growth/GrowthChartCard.vue'
import GrowthRecordModal from '@/components/growth/GrowthRecordModal.vue'

const isModalOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-brand-white">
    <AppHeader variant="member" />
    <div class="relative z-0 flex min-h-screen flex-col pt-14 lg:pt-17 lg:pl-52">
      <main class="min-w-0 flex-1 px-4 py-6 md:px-8 lg:px-10">
        <section class="mx-auto w-full">
          <PetSwitcher />
          <div class="mb-2 flex items-center justify-between gap-4 md:mb-6">
            <h1 class="text-xl font-bold text-brand-navy md:text-2xl">成長歷程</h1>
            <AddGrowthButton @click="isModalOpen = true" />
          </div>
          <div
            class="overflow-hidden rounded-3xl border border-brand-lightblue bg-brand-white shadow-[0_8px_28px_rgba(61,74,122,0.08)]"
          >
            <div class="border-b border-brand-lightblue bg-brand-lightblue px-2 py-1 md:px-8">
              <GrowthRangeTabs />
            </div>
            <div class="py-3 md:py-6">
              <GrowthChartCard />
            </div>
          </div>
        </section>
      </main>
    </div>
    <AppFooter class="lg:hidden" />

    <GrowthRecordModal
      :isOpen="isModalOpen"
      @close="isModalOpen = false"
      @submit="isModalOpen = false"
    />
  </div>
</template>
