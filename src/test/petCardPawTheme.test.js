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

test('PetCard 預設腳掌會跟著卡片主題色並套用 50% 透明度', () => {
  assert.match(petCard, /const pawThemeClass = computed/)
  assert.match(petCard, /green: 'text-\[var\(--color-brand-green\)\]\/50'/)
  assert.match(petCard, /orange: 'text-\[var\(--color-brand-orange\)\]\/50'/)
  assert.match(petCard, /blue: 'text-\[var\(--color-brand-blue\)\]\/50'/)
  assert.match(petCard, /v-if="hasPetImage"/)
  assert.match(petCard, /v-else/)
  assert.match(petCard, /:class="pawThemeClass"/)
  assert.match(petCard, /fill="currentColor"/)
})
