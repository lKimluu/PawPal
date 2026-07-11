import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(
  new URL('../components/pet/AddPetModal.vue', import.meta.url),
  'utf8',
)

test('新增寵物性別選項不包含未知', () => {
  assert.match(source, /const genderOptions\s*=\s*\['公', '母'\]/)
  assert.doesNotMatch(source, /const genderOptions\s*=\s*\[[^\]]*'未知'[^\]]*\]/)
})
