import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const petStore = readFileSync(new URL('../stores/petStore.js', import.meta.url), 'utf8')
const petCard = readFileSync(new URL('../components/pet/PetCard.vue', import.meta.url), 'utf8')

test('PetStore 會標記寵物是否有自訂照片', () => {
  assert.match(petStore, /const photoUrl = pet\.photoUrl \|\| pet\.photo_url \|\| pet\.avatar_url \|\| pet\.image/)
  assert.match(petStore, /hasCustomPhoto: Boolean\(photoUrl\)/)
  assert.match(petStore, /photoUrl: photoUrl \|\| defaultPetAvatar/)
})

test('PetCard 沒有自訂照片時顯示腳掌圖示，且不再依主題色變化', () => {
  assert.match(petCard, /const hasPetImage = computed/)
  assert.match(petCard, /v-if="hasPetImage"/)
  assert.match(petCard, /v-else/)
  assert.match(petCard, /fill="currentColor"/)
  assert.doesNotMatch(petCard, /pawThemeClass/)
})
