import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(
  new URL('../components/pet/AddPetModal.vue', import.meta.url),
  'utf8',
)

test('新增寵物視窗選擇其他種類時，會顯示自填寵物種類欄位', () => {
  assert.match(source, /customSpecies:\s*''/)
  assert.match(source, /form\.species\s*={2,3}\s*'其他'/)
  assert.match(source, /v-model="form\.customSpecies"/)
  assert.match(source, /maxlength="50"/)
})

test('新增寵物視窗送出時會把自填種類放進 species 欄位，不額外送 customSpecies', () => {
  assert.match(source, /const submittedSpecies\s*=/)
  assert.match(source, /form\.value\.customSpecies\.trim\(\)/)
  assert.match(source, /species:\s*submittedSpecies/)
  assert.doesNotMatch(source, /customSpecies:\s*form\.value\.customSpecies/)
})

test('新增寵物視窗關閉時會重置表單資料', () => {
  assert.match(source, /const handleClose\s*=\s*\(\)\s*=>\s*{\s*resetForm\(\)\s*emit\('close'\)\s*}/)
})
