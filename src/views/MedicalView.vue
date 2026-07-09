<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import MedicalFilterTabs from '@/components/medical/MedicalFilterTabs.vue'
import MedicalTimeline from '@/components/medical/MedicalTimeline.vue'
import AddMedicalButton from '@/components/medical/AddMedicalButton.vue'
import PetSwitcher from '@/components/pet/PetSwitcher.vue'
import MedicalRecordModal from '@/components/medical/MedicalRecordModal.vue'
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal.vue'
import { useMedicalStore } from '@/stores/medical.js'
import { usePetStore } from '@/stores/petStore.js'

const medicalStore = useMedicalStore()
const petStore = usePetStore()

const isModalOpen = ref(false)
const selectedRecord = ref(null)
const currentTab = ref('全部')
const isDeleteOpen = ref(false)
const recordToDelete = ref(null)

const currentPetId = ref(null)

onMounted(async () => {
  try {
    await petStore.fetchUserPets()
    if (petStore.pets.length > 0) {
      currentPetId.value = petStore.pets[0].id
      await medicalStore.fetchRecords(Number(currentPetId.value), '全部')
    }
  } catch (error) {
    console.error('初始化頁面失敗:', error)
  }
})

watch(
  () => currentPetId.value,
  async (newPetId) => {
    if (newPetId !== null && newPetId !== undefined) {
      await medicalStore.fetchRecords(Number(newPetId), '全部')
      if (medicalStore.errorMsg) {
        alert(medicalStore.errorMsg)
      }
    }
  },
)

const currentRecords = computed(() => {
  const allRecords = medicalStore.records || []

  if (currentTab.value === '全部') {
    return allRecords
  }

  return allRecords.filter((record) => record.recordType === currentTab.value)
})

const openAddModal = () => {
  selectedRecord.value = null
  isModalOpen.value = true
}

const openEditModal = (record) => {
  selectedRecord.value = record
  isModalOpen.value = true
}

const openDeleteConfirm = (record) => {
  recordToDelete.value = record
  isDeleteOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!recordToDelete.value) return
  const result = await medicalStore.deleteRecord(recordToDelete.value.id, currentPetId.value)
  if (result.success) {
    isDeleteOpen.value = false
    recordToDelete.value = null
  } else {
    alert(`刪除失敗：${result.message || '請確認該病歷的刪除權限'}`)
  }
}

const handleAddFirstRecord = () => {
  openAddModal()
}

const onModalSubmit = async ({ mode, data }) => {
  let result
  const activePetId = Number(currentPetId.value)

  if (mode === 'create') {
    result = await medicalStore.addRecord(activePetId, data)
  } else if (mode === 'edit') {
    result = await medicalStore.updateRecord(selectedRecord.value.id, activePetId, data)
  }

  if (result?.success) {
    isModalOpen.value = false
  } else {
    alert(`儲存失敗：${result?.message || '未知欄位錯誤，請檢查輸入內容'}`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-brand-white">
    <AppHeader variant="member" />

    <div class="relative z-0 flex min-h-screen flex-col pt-14 md:pt-17 lg:pl-52">
      <div
        v-if="medicalStore.isLoading"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
      >
        <div class="rounded-xl bg-white p-4 shadow-lg flex items-center gap-3">
          <span class="animate-spin text-xl">⏳</span>
          <span class="text-sm font-medium text-brand-navy">資料同步中...</span>
        </div>
      </div>
      <main class="min-w-0 flex-1 px-3 py-4 md:px-8 md:py-6 lg:px-10">
        <section class="mx-auto w-full">
          <PetSwitcher :pets="petStore.pets" v-model="currentPetId" />
          <div class="mb-3 flex items-center justify-between gap-4 md:mb-6">
            <h1 class="text-xl font-bold text-brand-navy md:text-2xl">醫療紀錄</h1>
            <AddMedicalButton @click="handleAddFirstRecord" />
          </div>
          <div
            class="overflow-hidden rounded-2xl border border-brand-lightblue bg-brand-white shadow-[0_8px_28px_rgba(61,74,122,0.08)] md:rounded-3xl"
          >
            <div class="border-b border-brand-lightblue bg-brand-lightblue px-2 py-1 md:px-8">
              <MedicalFilterTabs
                :model-value="currentTab"
                v-model="currentTab"
                @update:model-value="(val) => (currentTab = val)"
                @change="(val) => (currentTab = val)"
              />
            </div>

            <div v-if="currentRecords.length > 0" class="py-2 md:py-6">
              <MedicalTimeline
                :records="currentRecords"
                @edit-record="openEditModal"
                @delete-record="openDeleteConfirm"
              />
            </div>

            <div
              v-else
              class="flex flex-col items-center justify-center py-12 px-4 text-center md:py-24"
            >
              <div
                class="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-brand-blue/20 md:h-32 md:w-32 md:mb-5"
              >
                <img
                  class="w-12 h-12 md:w-20 md:h-20 object-contain"
                  src="@/assets/icons/diagnosis_b.svg"
                  alt="無醫療紀錄"
                />
              </div>
              <h3 class="text-base font-bold text-brand-navy md:text-xl">目前尚無醫療紀錄</h3>
              <p class="mt-1.5 text-xs font-medium text-brand-gray md:text-sm">
                此分類暫無紀錄，<br class="md:hidden" />快來為毛孩建立第一筆健康檔案吧！
              </p>
              <button
                type="button"
                @click="handleAddFirstRecord"
                class="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-blue/20 transition duration-200 hover:bg-[#7F97EC] hover:shadow-lg active:scale-95 md:mt-6 md:px-6 md:py-3 md:text-sm"
              >
                <span class="text-base font-normal -mt-0.5">＋</span>立即新增第一筆紀錄
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
    <AppFooter class="lg:hidden" />

    <MedicalRecordModal
      :is-open="isModalOpen"
      :initial-data="selectedRecord"
      @close="isModalOpen = false"
      @submit="onModalSubmit"
    />

    <DeleteConfirmModal
      :is-open="isDeleteOpen"
      title="確定刪除此醫療紀錄？"
      :item-name="recordToDelete ? recordToDelete.title : ''"
      @close="isDeleteOpen = false"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
