import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const petApi = readFileSync(new URL('../api/pet.js', import.meta.url), 'utf8')
const petStore = readFileSync(new URL('../stores/petStore.js', import.meta.url), 'utf8')
const dashboardView = readFileSync(new URL('../views/DashboardView.vue', import.meta.url), 'utf8')
const profileModal = readFileSync(new URL('../components/pet/PetProfileModal.vue', import.meta.url), 'utf8')
const baseButton = readFileSync(new URL('../components/common/BaseButton.vue', import.meta.url), 'utf8')

test('pet API 提供刪除寵物資料方法', () => {
  assert.match(petApi, /export async function deletePet\(id, token\)/)
  assert.match(petApi, /axios\.delete\(`\$\{API_BASE_URL\}\/api\/v1\/pets\/\$\{id\}`/)
  assert.match(petApi, /headers: getAuthHeaders\(token\)/)
})

test('pet store 刪除成功後同步移除前端寵物列表', () => {
  assert.match(petStore, /deletePet as deletePetApi/)
  assert.match(petStore, /async function deletePet\(id, token\)/)
  assert.match(petStore, /const result = await deletePetApi\(petId, token\)/)
  assert.match(petStore, /pets\.value = pets\.value\.filter\(\(pet\) => pet\.id !== petId\)/)
  assert.match(petStore, /selectedPetId\.value = pets\.value\[0\]\?\.id \?\? null/)
  assert.match(petStore, /deletePet,/)
})

test('PetProfileModal 提供刪除資料按鈕並發出 delete 事件', () => {
  assert.match(baseButton, /'orange'/)
  assert.match(profileModal, /isSaving/)
  assert.match(profileModal, /defineEmits\(\['close', 'delete'\]\)/)
  assert.match(profileModal, /function handleDeleteProfile\(\)/)
  assert.match(profileModal, /emit\('delete', props\.pet\)/)
  assert.match(profileModal, /variant="orange"[\s\S]*@click="handleDeleteProfile"/)
  assert.match(profileModal, /class="min-w-\[96px\]"/)
})

test('Dashboard 串接寵物資料刪除確認與 API 流程', () => {
  assert.match(dashboardView, /import DeleteConfirmModal from '@\/components\/common\/DeleteConfirmModal\.vue'/)
  assert.match(dashboardView, /const isPetDeleteModalOpen = ref\(false\)/)
  assert.match(dashboardView, /const petToDelete = ref\(null\)/)
  assert.match(dashboardView, /const isDeletingPet = ref\(false\)/)
  assert.match(dashboardView, /const handlePetDeleteRequest = \(pet\) =>/)
  assert.match(dashboardView, /const handleConfirmPetDelete = async \(\) =>/)
  assert.match(dashboardView, /petStore\.deletePet\(petToDelete\.value\.id, authStore\.token\)/)
  assert.match(dashboardView, /closePetProfile\(\)/)
  assert.match(dashboardView, /@delete="handlePetDeleteRequest"/)
  assert.match(dashboardView, /<DeleteConfirmModal/)
  assert.match(dashboardView, /@confirm="handleConfirmPetDelete"/)
})
