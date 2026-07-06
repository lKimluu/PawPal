import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildUpdatePetPayload, normalizePetFromApi } from '../api/pet.js'

test('buildUpdatePetPayload 會將寵物表單 camelCase 欄位轉成後端 snake_case 欄位', () => {
  const payload = buildUpdatePetPayload({
    name: 'Momo',
    species: 'dog',
    breed: 'mix',
    gender: 'female',
    birthday: '2026-07-06',
    weight: '4.2',
    microchipNumber: '900215000123456',
    neutered: true,
    bloodType: 'DEA 1.1',
    furColor: 'black',
    note: 'likes walks',
    photoUrl: 'https://example.com/momo.png',
  })

  assert.deepEqual(payload, {
    name: 'Momo',
    species: 'dog',
    breed: 'mix',
    gender: 'female',
    birthday: '2026-07-06',
    weight: 4.2,
    microchip_number: '900215000123456',
    neutered: true,
    blood_type: 'DEA 1.1',
    fur_color: 'black',
    notes: 'likes walks',
    avatar_url: 'https://example.com/momo.png',
  })
})

test('buildUpdatePetPayload 會移除空白選填值，但保留 false 與 0', () => {
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

test('normalizePetFromApi 會將後端寵物資料欄位轉成前端 camelCase 欄位', () => {
  const pet = normalizePetFromApi({
    id: 1,
    name: 'Momo',
    microchip_number: '900215000123456',
    blood_type: 'DEA 1.1',
    fur_color: 'black',
    notes: 'likes walks',
    avatar_url: 'https://example.com/momo.png',
  })

  assert.deepEqual(pet, {
    id: 1,
    name: 'Momo',
    microchip_number: '900215000123456',
    blood_type: 'DEA 1.1',
    fur_color: 'black',
    notes: 'likes walks',
    avatar_url: 'https://example.com/momo.png',
    microchipNumber: '900215000123456',
    bloodType: 'DEA 1.1',
    furColor: 'black',
    note: 'likes walks',
    photoUrl: 'https://example.com/momo.png',
  })
})
