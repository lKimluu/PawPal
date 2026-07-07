import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

function readSource(path) {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

const dashboardView = readSource('../views/DashboardView.vue')
const mainSource = readSource('../main.js')
const petCard = readSource('../components/pet/PetCard.vue')
const profileModal = readSource('../components/pet/PetProfileModal.vue')

test('Dashboard 會掛載寵物資料彈窗並能由寵物卡片開啟', () => {
  assert.match(dashboardView, /PetProfileModal/)
  assert.match(dashboardView, /selectedPet/)
  assert.match(dashboardView, /openPetProfile/)
  assert.match(dashboardView, /@click="openPetProfile\(pet\)"/)
})

test('PetCard 會發出 click 事件讓父層開啟寵物資料彈窗', () => {
  assert.match(petCard, /defineEmits\(\['click'\]\)/)
  assert.match(petCard, /@click="emit\('click'\)"/)
})

test('PetProfileModal 會顯示寵物詳細資料並使用 BaseButton 關閉', () => {
  assert.match(profileModal, /petPhoto/)
  assert.match(profileModal, /petImage/)
  assert.match(profileModal, /BaseButton/)
  assert.match(profileModal, /pet\.weight/)
  assert.match(profileModal, /pet\.microchipNumber/)
  assert.match(profileModal, /pet\.neutered/)
  assert.match(profileModal, /pet\.bloodType/)
  assert.match(profileModal, /pet\.furColor/)
  assert.match(profileModal, /pet\.note/)
})

test('PetProfileModal 會提供編輯模式並交由 Dashboard 呼叫 updatePet', () => {
  assert.match(profileModal, /defineEmits\(\['close', 'update'\]\)/)
  assert.match(profileModal, /isEditing/)
  assert.match(profileModal, /handleSubmit/)
  assert.match(profileModal, /v-model="form\.microchipNumber"/)
  assert.match(profileModal, /v-model="form\.bloodType"/)
  assert.match(profileModal, /v-model="form\.furColor"/)
  assert.match(profileModal, /v-model="form\.photoUrl"/)
  assert.match(profileModal, /v-model="form\.note"/)
  assert.match(dashboardView, /petStore\.updatePet/)
  assert.match(dashboardView, /handlePetUpdate/)
  assert.match(dashboardView, /@update="handlePetUpdate"/)
})

test('Dashboard 只渲染一個緊湊行程清單並串接新增、編輯、刪除事件', () => {
  const compactEventListCount = dashboardView.match(/<EventList[\s\S]*?:compact="true"[\s\S]*?\/>/g)?.length ?? 0

  assert.equal(compactEventListCount, 1)
  assert.match(dashboardView, /@add="openAddModal\(\)"/)
  assert.match(dashboardView, /@edit="openEditModal"/)
  assert.match(dashboardView, /@delete="handleDeleteRequest"/)
})

test('main.js 只註冊一次 v-calendar plugin', () => {
  const calendarPluginUseCount = mainSource.match(/app\.use\(SetupCalendar,\s*\{\}\)/g)?.length ?? 0

  assert.equal(calendarPluginUseCount, 1)
})
