import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatPetBirthday, formatPetGender } from '../utils/petDisplay.js'

test('formatPetBirthday 會將 ISO 時間格式轉成 YYYY-MM-DD', () => {
  assert.equal(formatPetBirthday('2026-07-07T16:00:00.000Z'), '2026-07-08')
})

test('formatPetBirthday 會保留原本就是 YYYY-MM-DD 的生日格式', () => {
  assert.equal(formatPetBirthday('2026-07-08'), '2026-07-08')
})

test('formatPetGender 會將 male 和 female 轉成中文', () => {
  assert.equal(formatPetGender('male'), '公')
  assert.equal(formatPetGender('female'), '母')
})
