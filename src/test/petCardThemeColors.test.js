import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const dashboardView = readFileSync(new URL('../views/DashboardView.vue', import.meta.url), 'utf8')
const petCard = readFileSync(new URL('../components/pet/PetCard.vue', import.meta.url), 'utf8')

test('Dashboard 寵物列已不再使用綠橘藍主題色循環', () => {
  assert.doesNotMatch(dashboardView, /const themeColors = \['green', 'orange', 'blue'\]/)
  assert.doesNotMatch(dashboardView, /:theme="themeColors\[index % themeColors\.length\]"/)
})

test('PetCard 圓形頭像已不再接受 theme prop', () => {
  assert.doesNotMatch(petCard, /theme: {/)
  assert.doesNotMatch(petCard, /validator: \(value\) => \['green', 'orange', 'blue'\]\.includes\(value\)/)
  assert.doesNotMatch(petCard, /bg-\[var\(--color-brand-green\)\]\/50/)
  assert.doesNotMatch(petCard, /bg-\[var\(--color-brand-orange\)\]\/50/)
  assert.doesNotMatch(petCard, /bg-\[var\(--color-brand-blue\)\]\/50/)
})
