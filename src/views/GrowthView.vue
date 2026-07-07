<script setup>
import { computed, ref, onMounted } from 'vue'
import { useGrowthStore } from '@/stores/growth.js'
import { useAuthStore } from '@/stores/auth.js'
import { usePetStore } from '@/stores/petStore.js'
import { useToastStore } from '@/stores/toast.js'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import PetSwitcher from '@/components/pet/PetSwitcher.vue'
import GrowthRangeTabs from '@/components/growth/GrowthRangeTabs.vue'
import AddGrowthButton from '@/components/growth/AddGrowthButton.vue'
import GrowthChartCard from '@/components/growth/GrowthChartCard.vue'
import GrowthRecordModal from '@/components/growth/GrowthRecordModal.vue'
import GrowthHistoryButton from '@/components/growth/GrowthHistoryButton.vue'
import GrowthHistoryModal from '@/components/growth/GrowthHistoryModal.vue'
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal.vue'

const growthStore = useGrowthStore()
const authStore = useAuthStore()
const petStore = usePetStore()
const toastStore = useToastStore()
const activeRange = ref('6 個月')

const isModalOpen = ref(false)
const isHistoryOpen = ref(false)
const isDeleteOpen = ref(false)
const pendingDeleteRecord = ref(null)

onMounted(() => {
  if (petStore.selectedPetId) {
    growthStore.fetchRecords(petStore.selectedPetId, authStore.token)
  }
})

const handleSubmit = async (formData) => {
  const results = await growthStore.createRecordsFrom(
    petStore.selectedPetId,
    formData,
    authStore.token,
  )
  const allSuccess = results.every((r) => r.success)
  if (allSuccess) {
    isModalOpen.value = false
    growthStore.fetchRecords(petStore.selectedPetId, authStore.token)
  }
}

const handleDeleteRecord = (record) => {
  pendingDeleteRecord.value = record
  isDeleteOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!pendingDeleteRecord.value) return

  const result = await growthStore.deleteRecord(pendingDeleteRecord.value.id, authStore.token)

  isDeleteOpen.value = false
  pendingDeleteRecord.value = null

  if (result.success) {
    toastStore.showToast('紀錄已刪除')
  } else {
    toastStore.showToast('刪除失敗，請稍後再試', 'error')
  }
}

const deleteItemName = computed(() => {
  if (!pendingDeleteRecord.value) return ''
  const labelMap = {
    weight: '體重',
    length: '身體長度',
    food_intake: '每日進食量',
    water_frequency: '飲水次數',
    urination: '排尿次數',
    defecation: '排便次數',
  }
  const label =
    labelMap[pendingDeleteRecord.value.metric_type] ?? pendingDeleteRecord.value.metric_type
  return `${label} ${pendingDeleteRecord.value.value} ${pendingDeleteRecord.value.unit}`
})
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
              <GrowthRangeTabs @change="activeRange = $event" />
            </div>
            <div class="py-3 md:py-6">
              <GrowthChartCard :records="growthStore.records" :range="activeRange" />
            </div>
          </div>
        </section>
      </main>
    </div>
    <AppFooter class="lg:hidden" />

    <GrowthHistoryModal
      :is-open="isHistoryOpen"
      :records="growthStore.records"
      @close="isHistoryOpen = false"
      @delete-record="handleDeleteRecord"
    />
    <GrowthRecordModal
      :is-open="isModalOpen"
      :is-submitting="growthStore.isSubmitting"
      :error-message="growthStore.errorMessage"
      @close="isModalOpen = false"
      @submit="handleSubmit"
    />
    <DeleteConfirmModal
      :is-open="isDeleteOpen"
      title="確定刪除此筆紀錄？"
      :item-name="deleteItemName"
      @close="isDeleteOpen = false"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
