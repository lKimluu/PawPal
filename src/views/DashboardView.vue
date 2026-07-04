<script setup>
import { ref, computed } from 'vue'
import { calendarEvents } from '@/data/calendarEvents'
import { pets as rawPets } from '@/data/pets'
import PetCard from '@/components/pet/PetCard.vue'
import AddPetButton from '@/components/pet/AddPetButton.vue'
import CalendarGrid from '@/components/calendar/CalendarGrid.vue'
import EventList from '@/components/calendar/EventList.vue'
import AddEventModal from '@/components/calendar/AddEventModal.vue'
import EditEventModal from '@/components/calendar/EditEventModal.vue'
import DeleteEventModal from '@/components/calendar/DeleteEventModal.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import memberBanner from '@/assets/images/member_banner_dashboard.png'
import { useAuthStore } from '@/stores/auth.js'

const themeColors = ['green', 'orange', 'blue']
const authStore = useAuthStore()

const showAddModal = ref(false)
const addModalDate = ref('')

const openAddModal = (date = '') => {
  addModalDate.value = date
  showAddModal.value = true
}

const handleAddSubmit = (payload) => {
  showAddModal.value = false
}

const showEditModal = ref(false)
const editingEvent = ref(null)

const openEditModal = (event) => {
  editingEvent.value = event
  showEditModal.value = true
}

const handleEditSubmit = (payload) => {
  showEditModal.value = false
}

const handleEditDelete = (event) => {
  showEditModal.value = false
}

const dashboardPets = rawPets.map((p) => ({
  ...p,
  image: p.photoUrl ?? null,
  ageUnit: '',
}))

const userName = computed(() => authStore.user?.name || '寵物家長')

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
const handleConfirmDelete = () => {
  // TODO: 串接刪除行程 API 後，於此呼叫並更新 calendarEvents
  handleCloseDeleteModal()
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
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-x-6 lg:gap-y-8">
        <CalendarGrid @open-add-modal="openAddModal" />

        <div
          class="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden rounded-3xl border border-brand-lightblue bg-brand-white shadow-[0_8px_28px_rgba(61,74,122,0.08)] p-4"
        >
          <EventList
            :events="calendarEvents"
            :compact="true"
            @add="openAddModal()"
            @edit="openEditModal"
          />
          <EventList :events="calendarEvents" :compact="true" @delete="handleDeleteRequest" />
        </div>

        <section class="lg:col-span-2 min-w-0">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">🐾</span>
            <h2 class="text-lg font-semibold text-[var(--color-brand-darkgray)]">寵物健康護照</h2>
          </div>

          <div
            class="flex flex-col md:flex-row gap-3 md:gap-4 overflow-y-auto max-h-[360px] md:overflow-y-hidden md:overflow-x-auto md:max-h-none pb-2"
          >
            <AddPetButton class="md:min-w-[132px] md:flex-1" />
            <PetCard
              v-for="(pet, index) in dashboardPets"
              :key="pet.id"
              :pet="pet"
              :theme="themeColors[index % themeColors.length]"
              class="md:min-w-[132px] md:flex-1"
            />
          </div>
        </section>
      </div>
    </div>
  </div>

  <AppFooter class="lg:hidden" />
  <AddEventModal
    :is-open="showAddModal"
    :selected-date="addModalDate"
    @close="showAddModal = false"
    @submit="handleAddSubmit"
  />
  <EditEventModal
    :is-open="showEditModal"
    :event="editingEvent"
    @close="showEditModal = false"
    @submit="handleEditSubmit"
    @delete="handleEditDelete"
  />

  <DeleteEventModal
    :is-open="showDeleteModal"
    :item-name="eventToDelete?.title ?? ''"
    @close="handleCloseDeleteModal"
    @confirm="handleConfirmDelete"
  />
</template>
