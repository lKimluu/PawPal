import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const petCard = readFileSync(new URL('../components/pet/PetCard.vue', import.meta.url), 'utf8')
const addPetButton = readFileSync(
  new URL('../components/pet/AddPetButton.vue', import.meta.url),
  'utf8',
)
const dashboardView = readFileSync(new URL('../views/DashboardView.vue', import.meta.url), 'utf8')

test('Dashboard 寵物列改為水平捲動的圓形頭像列，桌機頭像逐級放大', () => {
  assert.match(petCard, /shrink-0/)
  assert.match(petCard, /h-10 w-10 overflow-hidden rounded-full/)
  assert.match(petCard, /md:h-12 md:w-12 lg:h-14 lg:w-14/)
  assert.match(addPetButton, /shrink-0/)
  assert.match(addPetButton, /h-10 w-10 place-items-center rounded-full/)
  assert.match(addPetButton, /md:h-12 md:w-12 lg:h-14 lg:w-14/)
  assert.match(dashboardView, /flex min-w-0 flex-1 gap-0\.5 overflow-x-auto px-1 py-2 md:gap-1 lg:gap-2/)
  assert.doesNotMatch(dashboardView, /md:min-w-\[142px\] md:flex-1/)
})

test('Dashboard 寵物列與 Google 行事曆同步按鈕在桌機／平板同一列、按鈕不被擠壓', () => {
  assert.match(dashboardView, /<div class="mb-3 flex flex-col gap-3 md:flex-row md:items-center">/)
  assert.match(dashboardView, /<GoogleCalendarSyncButton class="self-end shrink-0 md:self-auto" \/>/)
})

test('Dashboard 手機版寵物頭像列在上、同步按鈕在下且靠右對齊，桌機／平板不受影響', () => {
  assert.doesNotMatch(dashboardView, /order-1|order-2|order-none/)
  assert.match(dashboardView, /self-end shrink-0 md:self-auto/)
})
