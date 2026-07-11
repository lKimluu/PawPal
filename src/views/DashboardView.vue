<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import PetCard from '@/components/pet/PetCard.vue'
import PetProfileModal from '@/components/pet/PetProfileModal.vue'
import AddPetButton from '@/components/pet/AddPetButton.vue'
import AddPetModal from '@/components/pet/AddPetModal.vue'
import CalendarGrid from '@/components/calendar/CalendarGrid.vue'
import GoogleCalendarSyncButton from '@/components/calendar/GoogleCalendarSyncButton.vue'
import EventList from '@/components/calendar/EventList.vue'
import AddEventModal from '@/components/calendar/AddEventModal.vue'
import EditEventModal from '@/components/calendar/EditEventModal.vue'
import DeleteEventModal from '@/components/calendar/DeleteEventModal.vue'
import DayEventsModal from '@/components/calendar/DayEventsModal.vue'
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import memberBanner from '@/assets/images/member_banner_dashboard.png'
import { useAuthStore } from '@/stores/auth.js'
import { useCalendarStore } from '@/stores/calendar.js'
import { usePetStore } from '@/stores/petStore.js'
import { useToastStore } from '@/stores/toast.js'

const themeColors = ['green', 'orange', 'blue']
const authStore = useAuthStore()
const calendarStore = useCalendarStore()
const petStore = usePetStore()
const toastStore = useToastStore()
const { pets } = storeToRefs(petStore)
const selectedPet = ref(null)
const isPetProfileOpen = ref(false)
const isPetSaving = ref(false)
const petUpdateError = ref('')
const isAddPetModalOpen = ref(false)
const isCreatingPet = ref(false)
const addPetErrorMessage = ref('')
const isPetDeleteModalOpen = ref(false)
const petToDelete = ref(null)
const isDeletingPet = ref(false)

const showAddModal = ref(false)
const addModalDate = ref('')

const openAddModal = (date = '') => {
  addModalDate.value = date
  showAddModal.value = true
}

const handleAddSubmit = async (payload) => {
  const result = await calendarStore.addEvent(payload)
  if (result.success) {
    showAddModal.value = false
    toastStore.showToast(result.message || '新增成功', 'success')
  } else {
    toastStore.showToast(result.message, 'error')
  }
}

const showDayModal = ref(false)
const dayModalDate = ref('')

const dayModalEvents = computed(() =>
  calendarStore.filteredEvents.filter((e) => e.eventDate === dayModalDate.value),
)

const openDayModal = (date) => {
  dayModalDate.value = date
  showDayModal.value = true
}

const handleDayModalAdd = (date) => {
  showDayModal.value = false
  openAddModal(date)
}

const handleDayModalEdit = (event) => {
  showDayModal.value = false
  openEditModal(event)
}

const handleDayModalDelete = (event) => {
  showDayModal.value = false
  handleDeleteRequest(event)
}

const showEditModal = ref(false)
const editingEvent = ref(null)

const openEditModal = (event) => {
  editingEvent.value = event
  showEditModal.value = true
}

const handleEditSubmit = async (payload) => {
  const result = await calendarStore.updateEvent(editingEvent.value.id, payload)
  if (result.success) {
    showEditModal.value = false
    toastStore.showToast(result.message || '更新成功', 'success')
  } else {
    toastStore.showToast(result.message, 'error')
  }
}

const handleEditDelete = (event) => {
  showEditModal.value = false
  handleDeleteRequest(event)
}

const handleResync = async (event) => {
  const result = await calendarStore.resyncEvent(event.id)
  if (result.success) {
    toastStore.showToast(result.message || '重新同步成功')
  } else {
    toastStore.showToast(result.message || '重新同步失敗，請稍後再試', 'error')
  }
}

const dashboardPets = computed(() =>
  pets.value.map((p) => ({
    ...p,
    image: p.photoUrl ?? p.image ?? null,
    ageUnit: p.ageUnit ?? '',
  })),
)

const userName = computed(() => authStore.user?.name || '寵物家長')

onMounted(() => {
  calendarStore.fetchEvents()

  if (authStore.isLoggedIn) {
    petStore.fetchPets()
  }
})

const showDeleteModal = ref(false)
const eventToDelete = ref(null)

const handleDeleteRequest = (event) => {
  eventToDelete.value = event
  showDeleteModal.value = true
}
const handleCloseDeleteModal = () => {
  showDeleteModal.value = false
  eventToDelete.value = null
}
const handleConfirmDelete = async () => {
  const result = await calendarStore.deleteEvent(eventToDelete.value.id)
  if (result.success) {
    handleCloseDeleteModal()
    toastStore.showToast(result.message || '刪除成功', 'success')
  } else {
    toastStore.showToast(result.message, 'error')
  }
}

const openPetProfile = (pet) => {
  selectedPet.value = pet
  petUpdateError.value = ''
  isPetProfileOpen.value = true
}

const closePetProfile = () => {
  isPetProfileOpen.value = false
  selectedPet.value = null
  petUpdateError.value = ''
}

const handlePetUpdate = async ({ id, data }) => {
  if (!id) {
    petUpdateError.value = '找不到要修改的寵物，請重新整理後再試'
    return
  }

  isPetSaving.value = true
  petUpdateError.value = ''

  const result = await petStore.updatePet(id, data, authStore.token)

  isPetSaving.value = false

  if (!result.success) {
    petUpdateError.value = result.message || '寵物資料更新失敗，請稍後再試'
    return
  }

  selectedPet.value = dashboardPets.value.find((pet) => pet.id === Number(id)) ?? selectedPet.value
  toastStore.showToast(result.message || '寵物資料更新成功')
  closePetProfile()
}

const handlePetDeleteRequest = (pet) => {
  petToDelete.value = pet
  isPetDeleteModalOpen.value = true
}

const handleClosePetDeleteModal = () => {
  if (isDeletingPet.value) return

  isPetDeleteModalOpen.value = false
  petToDelete.value = null
}

const handleConfirmPetDelete = async () => {
  if (!petToDelete.value?.id) return

  isDeletingPet.value = true
  const result = await petStore.deletePet(petToDelete.value.id, authStore.token)
  isDeletingPet.value = false

  if (result.success) {
    handleClosePetDeleteModal()
    closePetProfile()
    toastStore.showToast(result.message || '寵物資料刪除成功', 'success')
    return
  }

  toastStore.showToast(result.message || '寵物資料刪除失敗，請稍後再試', 'error')
}

const openAddPetModal = () => {
  addPetErrorMessage.value = ''
  isAddPetModalOpen.value = true
}

const closeAddPetModal = () => {
  if (!isCreatingPet.value) {
    isAddPetModalOpen.value = false
    addPetErrorMessage.value = ''
  }
}

const handleCreatePet = async (payload) => {
  isCreatingPet.value = true
  addPetErrorMessage.value = ''

  const result = await petStore.createPet(payload)

  isCreatingPet.value = false

  if (result.success) {
    isAddPetModalOpen.value = false
    toastStore.showToast(result.message || '寵物資料新增成功')
    return
  }

  addPetErrorMessage.value = result.message || '寵物資料新增失敗，請稍後再試'
  toastStore.showToast(addPetErrorMessage.value, 'error')
}
</script>

<template>
  <AppHeader variant="member" />

  <div class="lg:pl-52">
    <section class="w-full relative mt-[55px] lg:mt-[68px]">
      <img
        :src="memberBanner"
        class="w-full block min-h-[160px] object-cover object-[20%_top]"
        alt="banner"
      />
      <div class="absolute inset-0 flex items-center">
        <div class="mx-auto md:ml-[22%] md:translate-x-0 text-center md:text-left">
          <h1 class="text-lg md:text-2xl font-bold text-[var(--color-brand-navy)]">
            Hi，{{ userName }}！
          </h1>
          <p class="text-xs md:text-sm text-[var(--color-brand-gray)]">毛孩的一切都在這裡</p>
        </div>
      </div>
    </section>

    <div class="w-full px-4 lg:px-8 pb-16 mt-2 md:mt-6">
      <div class="mb-3 flex justify-end">
        <GoogleCalendarSyncButton />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-x-6 lg:gap-y-8">
        <CalendarGrid @open-add-modal="openAddModal" @open-day-modal="openDayModal" />

        <div
          class="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden rounded-3xl border border-brand-lightblue bg-brand-white shadow-[0_8px_28px_rgba(61,74,122,0.08)] p-4"
        >
          <EventList
            :events="calendarStore.upcomingEvents"
            :compact="true"
            @add="openAddModal()"
            @edit="openEditModal"
            @delete="handleDeleteRequest"
            @resync="handleResync"
          />
        </div>

        <section class="lg:col-span-2 min-w-0">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">🐾</span>
            <h2 class="text-lg font-semibold text-[var(--color-brand-darkgray)]">寵物健康護照</h2>
          </div>

          <div
            class="flex flex-col md:flex-row gap-3 md:gap-4 overflow-y-auto max-h-[360px] md:overflow-y-hidden md:overflow-x-auto md:max-h-none pb-2"
          >
            <AddPetButton class="md:min-w-[142px] md:flex-1" @click="openAddPetModal" />
            <PetCard
              v-for="(pet, index) in dashboardPets"
              :key="pet.id"
              :pet="pet"
              :theme="themeColors[index % themeColors.length]"
              class="md:min-w-[142px] md:flex-1"
              @click="openPetProfile(pet)"
            />
          </div>
        </section>
      </div>
    </div>
  </div>

  <AppFooter class="lg:hidden" />
  <DayEventsModal
    :is-open="showDayModal"
    :date="dayModalDate"
    :events="dayModalEvents"
    @close="showDayModal = false"
    @add="handleDayModalAdd"
    @edit="handleDayModalEdit"
    @delete="handleDayModalDelete"
    @resync="handleResync"
  />
  <AddEventModal
    :is-open="showAddModal"
    :selected-date="addModalDate"
    :is-loading="calendarStore.isLoading"
    @close="showAddModal = false"
    @submit="handleAddSubmit"
  />
  <EditEventModal
    :is-open="showEditModal"
    :event="editingEvent"
    :is-loading="calendarStore.isLoading"
    @close="showEditModal = false"
    @submit="handleEditSubmit"
    @delete="handleEditDelete"
  />

  <DeleteEventModal
    :is-open="showDeleteModal"
    :item-name="eventToDelete?.title ?? ''"
    :is-loading="calendarStore.isLoading"
    @close="handleCloseDeleteModal"
    @confirm="handleConfirmDelete"
  />

  <PetProfileModal
    :is-open="isPetProfileOpen"
    :pet="selectedPet"
    :is-saving="isPetSaving || isDeletingPet"
    :error-message="petUpdateError"
    @close="closePetProfile"
    @update="handlePetUpdate"
    @delete="handlePetDeleteRequest"
  />
  <DeleteConfirmModal
    :is-open="isPetDeleteModalOpen"
    title="確認刪除寵物資料？"
    :item-name="petToDelete?.name ?? ''"
    :is-loading="isDeletingPet"
    @close="handleClosePetDeleteModal"
    @confirm="handleConfirmPetDelete"
  />
  <AddPetModal
    :is-open="isAddPetModalOpen"
    :is-loading="isCreatingPet"
    :error-message="addPetErrorMessage"
    @close="closeAddPetModal"
    @submit="handleCreatePet"
  />
</template>
