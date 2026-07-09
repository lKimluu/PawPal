import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const petCard = readFileSync(new URL('../components/pet/PetCard.vue', import.meta.url), 'utf8')

test('PetCard 品種與年齡固定對齊且長品種不跑版', () => {
  assert.match(petCard, /grid-cols-\[2em_0\.5rem_minmax\(0,1fr\)\]/)
  assert.match(petCard, /<span class="text-left">品種<\/span>/)
  assert.match(petCard, /<span class="text-left">年齡<\/span>/)
  assert.match(petCard, /<span class="min-w-0 truncate text-left">\s*{{ pet\?\.breed \|\| '-' }}\s*<\/span>/)
  assert.match(petCard, /<span class="min-w-0 truncate text-left">\s*{{ ageText }}\s*<\/span>/)
  assert.doesNotMatch(petCard, /品種 \| {{ pet\?\.breed \|\| '-' }}/)
})
