<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import PetSwitcher from '@/components/pet/PetSwitcher.vue'
import GrowthRangeTabs from '@/components/growth/GrowthRangeTabs.vue'
import AddGrowthButton from '@/components/growth/AddGrowthButton.vue'
import GrowthChartCard from '@/components/growth/GrowthChartCard.vue'
import GrowthRecordModal from '@/components/growth/GrowthRecordModal.vue'
import GrowthHistoryButton from '@/components/growth/GrowthHistoryButton.vue'
import GrowthHistoryModal from '@/components/growth/GrowthHistoryModal.vue'

const isHistoryOpen = ref(false)
const isModalOpen = ref(false)

const mockHistoryRecords = [
  { id: 1, metric_type: 'weight', value: 5.2, unit: 'kg', recorded_at: '2026-07-01' },
  { id: 2, metric_type: 'length', value: 20, unit: 'cm', recorded_at: '2026-07-01' },
  { id: 3, metric_type: 'food_intake', value: 120, unit: 'g', recorded_at: '2026-07-02' },
  { id: 4, metric_type: 'water_frequency', value: 4, unit: '次', recorded_at: '2026-07-02' },
  { id: 5, metric_type: 'urination', value: 3, unit: '次', recorded_at: '2026-07-03' },
  { id: 6, metric_type: 'defecation', value: 1, unit: '次', recorded_at: '2026-07-03' },
  { id: 7, metric_type: 'weight', value: 5.3, unit: 'kg', recorded_at: '2026-07-04' },
]
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
            <div class="flex items-center gap-2">
              <GrowthHistoryButton @click="isHistoryOpen = true" />
              <AddGrowthButton @click="isModalOpen = true" />
            </div>
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

    <GrowthHistoryModal
      :is-open="isHistoryOpen"
      :records="mockHistoryRecords"
      @close="isHistoryOpen = false"
    />
    <GrowthRecordModal
      :is-open="isModalOpen"
      @close="isModalOpen = false"
      @submit="isModalOpen = false"
    />
  </div>
</template>
