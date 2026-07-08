import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

import {
  buildUpdatePetPayload,
  createPetRequestData,
  mapPetFromApi,
  mapPetToApi,
  normalizePetFromApi,
  resolvePetUpdateErrorMessage,
  updatePetRequestData,
} from '../api/pet.js'

function readSource(path) {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

test('mapPetToApi maps pet form fields to API schema', () => {
  const payload = mapPetToApi({
    name: ' Momo ',
    species: 'dog',
    breed: 'Shiba',
    gender: 'female',
    birthday: '2024-01-02',
    weight: '6.8',
    microchipNumber: '900215000123456',
    neutered: true,
    bloodType: 'DEA 1.1',
    furColor: 'brown',
    note: 'friendly',
    photoUrl: 'https://example.com/momo.png',
  })

  assert.deepEqual(payload, {
    name: 'Momo',
    species: 'dog',
    breed: 'Shiba',
    gender: 'female',
    birthday: '2024-01-02',
    weight: 6.8,
    microchip_number: '900215000123456',
    neutered: true,
    blood_type: 'DEA 1.1',
    fur_color: 'brown',
    notes: 'friendly',
    avatar_url: 'https://example.com/momo.png',
  })
})

test('buildUpdatePetPayload skips empty fields and preserves false and zero', () => {
  const payload = buildUpdatePetPayload({
    name: 'Momo',
    species: 'dog',
    breed: '',
    birthday: '',
    weight: 0,
    microchipNumber: '   ',
    neutered: false,
    note: '',
  })

  assert.deepEqual(payload, {
    name: 'Momo',
    species: 'dog',
    weight: 0,
    neutered: false,
  })
})

test('mapPetFromApi maps API pet fields back to frontend schema', () => {
  const pet = mapPetFromApi({
    id: 7,
    name: 'Momo',
    species: 'dog',
    microchip_number: '900215000123456',
    blood_type: 'DEA 1.1',
    fur_color: 'brown',
    notes: 'friendly',
    avatar_url: 'https://example.com/momo.png',
  })

  assert.equal(pet.microchipNumber, '900215000123456')
  assert.equal(pet.bloodType, 'DEA 1.1')
  assert.equal(pet.furColor, 'brown')
  assert.equal(pet.note, 'friendly')
  assert.equal(pet.photoUrl, 'https://example.com/momo.png')
  assert.equal(pet.image, 'https://example.com/momo.png')
})

test('normalizePetFromApi remains compatible with update pet call sites', () => {
  const pet = normalizePetFromApi({
    id: 1,
    name: 'Momo',
    microchip_number: '900215000123456',
    blood_type: 'DEA 1.1',
    fur_color: 'black',
    notes: 'likes walks',
    avatar_url: 'https://example.com/momo.png',
  })

  assert.equal(pet.microchipNumber, '900215000123456')
  assert.equal(pet.bloodType, 'DEA 1.1')
  assert.equal(pet.furColor, 'black')
  assert.equal(pet.note, 'likes walks')
  assert.equal(pet.photoUrl, 'https://example.com/momo.png')
})

test('resolvePetUpdateErrorMessage returns update-specific messages', () => {
  assert.equal(
    resolvePetUpdateErrorMessage({ response: { status: 400, data: {} } }),
    '寵物資料格式不正確，請檢查必填欄位與體重格式',
  )
  assert.equal(
    resolvePetUpdateErrorMessage({ response: { status: 404, data: {} } }),
    '找不到這隻寵物，請重新整理後再試',
  )
  assert.equal(
    resolvePetUpdateErrorMessage({ response: { status: 409, data: {} } }),
    '晶片號碼已被使用，請確認後再送出',
  )
  assert.equal(
    resolvePetUpdateErrorMessage({ request: {} }),
    '無法連線到伺服器，請確認後端服務是否已啟動',
  )
})

test('createPetRequestData builds multipart FormData when avatarFile is present', async () => {
  const avatarFile = new Blob(['avatar'], { type: 'image/png' })
  const request = createPetRequestData({
    name: 'Momo',
    species: 'dog',
    weight: '6.8',
    neutered: true,
    avatarFile,
  })

  assert.ok(request.data instanceof FormData)
  assert.equal(request.headers['Content-Type'], undefined)
  assert.equal(request.data.get('name'), 'Momo')
  assert.equal(request.data.get('species'), 'dog')
  assert.equal(request.data.get('weight'), '6.8')
  assert.equal(request.data.get('neutered'), 'true')
  assert.equal(await request.data.get('avatar').text(), 'avatar')
})

test('createPetRequestData keeps JSON payload when avatarFile is absent', () => {
  const request = createPetRequestData({
    name: 'Momo',
    species: 'dog',
    photoUrl: 'https://example.com/momo.png',
  })

  assert.equal(request.headers['Content-Type'], 'application/json')
  assert.deepEqual(request.data, {
    name: 'Momo',
    species: 'dog',
    avatar_url: 'https://example.com/momo.png',
  })
})

test('updatePetRequestData builds multipart FormData when photoFile is present', async () => {
  const photoFile = new Blob(['avatar'], { type: 'image/png' })
  const request = updatePetRequestData(
    {
      name: 'Momo',
      weight: '7.2',
      neutered: false,
      photoFile,
    },
    'token-123',
  )

  assert.ok(request.data instanceof FormData)
  assert.equal(request.headers['Content-Type'], undefined)
  assert.equal(request.headers.Authorization, 'Bearer token-123')
  assert.equal(request.data.get('name'), 'Momo')
  assert.equal(request.data.get('weight'), '7.2')
  assert.equal(request.data.get('neutered'), 'false')
  assert.equal(await request.data.get('avatar').text(), 'avatar')
})

test('Dashboard wires pet store, add pet modal, and update pet modal', () => {
  const dashboardView = readSource('../views/DashboardView.vue')
  const addPetButton = readSource('../components/pet/AddPetButton.vue')
  const addPetModal = readSource('../components/pet/AddPetModal.vue')
  const petStore = readSource('../stores/petStore.js')

  assert.match(addPetButton, /defineEmits\(\['click'\]\)/)
  assert.match(addPetButton, /@click="emit\('click'\)"/)
  assert.match(addPetModal, /defineEmits\(\['close', 'submit'\]\)/)
  assert.match(addPetModal, /avatarFile/)
  assert.match(dashboardView, /usePetStore/)
  assert.match(dashboardView, /AddPetModal/)
  assert.match(dashboardView, /PetProfileModal/)
  assert.match(dashboardView, /@click="openAddPetModal"/)
  assert.match(dashboardView, /@submit="handleCreatePet"/)
  assert.match(dashboardView, /@update="handlePetUpdate"/)
  assert.match(petStore, /createPetApi/)
  assert.match(petStore, /updatePetApi/)
  assert.match(petStore, /async function createPet/)
  assert.match(petStore, /async function updatePet/)
})
