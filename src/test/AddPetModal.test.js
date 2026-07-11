import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(
  new URL('../components/pet/AddPetModal.vue', import.meta.url),
  'utf8',
)

test('新增寵物表單支援其他種類並送出自訂種類欄位', () => {
  assert.match(source, /customSpecies:\s*''/)
  assert.match(source, /form\.species\s*={2,3}\s*'其他'/)
  assert.match(source, /v-model="form\.customSpecies"/)
  assert.match(source, /maxlength="50"/)
})

test('新增寵物表單送出時會用自訂種類覆蓋 species 欄位', () => {
  assert.match(source, /const submittedSpecies\s*=/)
  assert.match(source, /form\.value\.customSpecies\.trim\(\)/)
  assert.match(source, /species:\s*submittedSpecies/)
  assert.doesNotMatch(source, /customSpecies:\s*form\.value\.customSpecies/)
})

test('新增寵物表單關閉時會重置資料', () => {
  assert.match(source, /const handleClose\s*=\s*\(\)\s*=>\s*{\s*resetForm\(\)\s*emit\('close'\)\s*}/)
})

test('新增寵物性別不是必填且不能出現未知選項', () => {
  assert.match(source, /const genderOptions = \['公', '母'\]/)
  assert.doesNotMatch(source, /if \(!form\.value\.gender\)/)
  assert.doesNotMatch(source, /validationError\.value = '請選擇寵物性別'/)
  assert.doesNotMatch(source, /<select v-model="form\.gender"[\s\S]*required/)
  assert.doesNotMatch(source, /'未知'/)
  assert.doesNotMatch(source, />未知</)
})

test('新增寵物表單不再使用圖片網址欄位並改走檔案上傳流程', () => {
  assert.doesNotMatch(source, /圖片網址/)
  assert.doesNotMatch(source, /form\.photoUrl/)
  assert.match(source, /photo_files:\s*\[\]/)
  assert.match(source, /avatarFile:\s*form\.value\.photo_files\[0\]\s*\|\|\s*null/)
  assert.match(source, /上傳寵物大頭貼/)
})
