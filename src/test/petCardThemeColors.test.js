import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const dashboardView = readFileSync(new URL('../views/DashboardView.vue', import.meta.url), 'utf8')
const petCard = readFileSync(new URL('../components/pet/PetCard.vue', import.meta.url), 'utf8')

test('Dashboard 寵物卡片維持綠色、橘色、藍色循環', () => {
  assert.match(dashboardView, /const themeColors = \['green', 'orange', 'blue'\]/)
  assert.match(dashboardView, /:theme="themeColors\[index % themeColors\.length\]"/)
})

test('PetCard 卡片底色使用原本三色的 50% 透明度', () => {
  assert.match(petCard, /default: 'green'/)
  assert.match(petCard, /validator: \(value\) => \['green', 'orange', 'blue'\]\.includes\(value\)/)
  assert.match(petCard, /green: 'bg-\[var\(--color-brand-green\)\]\/50'/)
  assert.match(petCard, /orange: 'bg-\[var\(--color-brand-orange\)\]\/50'/)
  assert.match(petCard, /blue: 'bg-\[var\(--color-brand-blue\)\]\/50'/)
})

test('PetCard 預設腳掌顏色也使用 50% 透明度', () => {
  assert.match(petCard, /green: 'text-\[var\(--color-brand-green\)\]\/50'/)
  assert.match(petCard, /orange: 'text-\[var\(--color-brand-orange\)\]\/50'/)
  assert.match(petCard, /blue: 'text-\[var\(--color-brand-blue\)\]\/50'/)
})
