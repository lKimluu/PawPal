import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const petCard = readFileSync(new URL('../components/pet/PetCard.vue', import.meta.url), 'utf8')
const addPetButton = readFileSync(
  new URL('../components/pet/AddPetButton.vue', import.meta.url),
  'utf8',
)
const dashboardView = readFileSync(new URL('../views/DashboardView.vue', import.meta.url), 'utf8')

test('Dashboard 寵物卡片桌機點擊範圍寬度加寬', () => {
  assert.match(petCard, /md:max-w-\[142px\]/)
  assert.match(addPetButton, /md:max-w-\[142px\]/)
  assert.match(dashboardView, /AddPetButton class="md:min-w-\[142px\] md:flex-1"/)
  assert.match(dashboardView, /class="md:min-w-\[142px\] md:flex-1"/)
  assert.doesNotMatch(petCard, /md:max-w-\[132px\]/)
})
