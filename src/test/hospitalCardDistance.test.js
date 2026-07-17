import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const hospitalCard = readFileSync(
  new URL('../components/hospital/HospitalCard.vue', import.meta.url),
  'utf8',
)

test('HospitalCard 顯示正規化的未知距離時不加 km 後綴', () => {
  assert.match(hospitalCard, /const displayDistance = computed/)
  assert.match(hospitalCard, /props\.hospital\.distance === '—'/)
  assert.doesNotMatch(hospitalCard, /props\.hospital\.distance === '\?\?'/)
  assert.match(hospitalCard, /距離未知/)
  assert.match(hospitalCard, /\{\{ displayDistance \}\}/)
})
