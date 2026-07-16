import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const petCard = readFileSync(new URL('../components/pet/PetCard.vue', import.meta.url), 'utf8')

test('PetCard 圓形樣式已不再顯示品種與年齡資訊', () => {
  assert.doesNotMatch(petCard, /grid-cols-\[2em_0\.5rem_minmax\(0,1fr\)\]/)
  assert.doesNotMatch(petCard, /<span class="text-left">品種<\/span>/)
  assert.doesNotMatch(petCard, /<span class="text-left">年齡<\/span>/)
  assert.doesNotMatch(petCard, /pet\?\.breed/)
  assert.doesNotMatch(petCard, /ageText/)
})

test('PetCard 只顯示圓形頭像與寵物名稱', () => {
  assert.match(petCard, /rounded-full/)
  assert.match(petCard, /{{ pet\?\.name \|\| '未命名' }}/)
})
