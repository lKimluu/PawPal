import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

import { createPetRequestData, mapPetFromApi, mapPetToApi } from '../api/pet.js'

function readSource(path) {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

test('mapPetToApi 會將前端寵物欄位轉成後端 schema', () => {
  const payload = mapPetToApi({
    name: 'Momo',
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

test('mapPetToApi 會略過空白選填欄位並保留必填欄位', () => {
  const payload = mapPetToApi({
    name: 'Momo',
    species: 'dog',
    breed: '',
    weight: '',
    neutered: false,
    note: '',
  })

  assert.deepEqual(payload, {
    name: 'Momo',
    species: 'dog',
    neutered: false,
  })
})

test('mapPetFromApi 會將後端寵物欄位轉成前端 schema', () => {
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
})

test('createPetRequestData 有 avatarFile 時會建立 multipart FormData', async () => {
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

test('createPetRequestData 沒有 avatarFile 時維持 JSON payload', () => {
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

test('新增寵物功能會透過 store 與 Dashboard 串接 modal', () => {
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
  assert.match(dashboardView, /@click="openAddPetModal"/)
  assert.match(dashboardView, /@submit="handleCreatePet"/)
  assert.match(petStore, /createPetApi/)
  assert.match(petStore, /async function createPet/)
  assert.match(petStore, /pets\.value = \[createdPet, \.\.\.pets\.value\]/)
})
