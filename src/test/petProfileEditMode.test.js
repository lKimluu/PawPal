import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const profileModal = readFileSync(
  new URL('../components/pet/PetProfileModal.vue', import.meta.url),
  'utf8',
)

test('PetProfileModal 可在原位置切換寵物資料欄位為編輯模式', () => {
  assert.match(profileModal, /isEditingProfile/)
  assert.match(profileModal, /editForm/)
  assert.match(profileModal, /handleStartEdit/)
  assert.match(profileModal, /handleCancelEdit/)
  assert.match(profileModal, /handleSaveEdit/)
  assert.match(profileModal, /formatBirthdayForDateInput/)
  assert.match(profileModal, /h-\[540px\]/)
  assert.match(profileModal, /overflow-y-auto/)
})

test('PetProfileModal 編輯模式維持欄位內嵌排版', () => {
  assert.match(profileModal, /detailInlineInputClass/)
  assert.match(profileModal, /border-0 bg-transparent p-0/)
  assert.match(profileModal, /focus:ring-0/)
  assert.match(profileModal, /editForm\.weight/)
  assert.match(profileModal, /editForm\.microchipNumber/)
  assert.match(profileModal, /editForm\.neutered/)
  assert.match(profileModal, /editForm\.bloodType/)
  assert.match(profileModal, /editForm\.furColor/)
  assert.match(profileModal, /editForm\.note/)
  assert.doesNotMatch(profileModal, /<form v-else class="min-h-0 min-w-0 space-y-4/)
  assert.doesNotMatch(profileModal, /min-h-\[72px\]/)
})

test('PetProfileModal 性別與結紮欄位使用固定高度下拉選單', () => {
  assert.match(profileModal, /function normalizeGender/)
  assert.match(profileModal, /gender: normalizeGender\(pet\.gender\)/)
  assert.match(profileModal, /v-model="editForm\.gender"/)
  assert.match(profileModal, /<select[\s\S]*v-model="editForm\.gender"[\s\S]*profileGenderSelectClass/)
  assert.match(profileModal, /<option value="公">公<\/option>/)
  assert.match(profileModal, /<option value="母">母<\/option>/)
  assert.match(profileModal, /<option value="未知">未知<\/option>/)
  assert.match(profileModal, /v-model="editForm\.neutered"/)
  assert.match(profileModal, /<select[\s\S]*v-model="editForm\.neutered"[\s\S]*detailSelectClass/)
  assert.match(profileModal, /<option value="已結紮">已結紮<\/option>/)
  assert.match(profileModal, /<option value="未結紮">未結紮<\/option>/)
  assert.match(profileModal, /appearance-none/)
  assert.doesNotMatch(profileModal, /<option value="male">male<\/option>/)
  assert.doesNotMatch(profileModal, /<option value="female">female<\/option>/)
  assert.doesNotMatch(profileModal, /v-model="editForm\.neutered" type="checkbox"/)
})

test('PetProfileModal 名稱編輯欄位維持標題尺寸', () => {
  assert.match(profileModal, /nameInputClass/)
  assert.match(profileModal, /text-3xl font-bold tracking-wide text-brand-navy/)
  assert.match(profileModal, /`\$\{nameInputClass\} w-full max-w-\[180px\]`/)
  assert.doesNotMatch(profileModal, /-ml-1 w-full max-w-\[220px\] text-2xl/)
})

test('PetProfileModal 維持透明輸入框樣式', () => {
  assert.match(profileModal, /text-base font-medium text-brand-darkgray/)
  assert.match(profileModal, /bg-transparent/)
  assert.match(profileModal, /focus:ring-0/)
  assert.match(profileModal, /detailInlineInputClass/)
  assert.doesNotMatch(profileModal, /rounded-xl border border-slate-200 bg-slate-50\/70/)
})

test('PetProfileModal 體重編輯欄位為文字輸入並顯示 kg 單位', () => {
  assert.match(profileModal, /v-model="editForm\.weight"/)
  assert.match(profileModal, /type="text"[\s\S]*v-model="editForm\.weight"/)
  assert.match(profileModal, /v-model="editForm\.weight"[\s\S]*<span>kg<\/span>/)
  assert.match(profileModal, /focusWeightInput/)
  assert.match(profileModal, /`\$\{detailInlineInputClass\} w-8`/)
  assert.doesNotMatch(profileModal, /v-model="editForm\.weight"[\s\S]{0,160}type="number"/)
  assert.doesNotMatch(profileModal, /`\$\{detailInlineInputClass\} w-20`/)
  assert.doesNotMatch(profileModal, /`\$\{detailInputClass\} w-\[4ch\]`/)
})

test('PetProfileModal 維持桌機與手機版一致的版面尺寸', () => {
  assert.match(profileModal, /nameInputClass/)
  assert.match(profileModal, /font-bold text-brand-navy/)
  assert.match(profileModal, /const profilePhotoClass =/)
  assert.match(profileModal, /const profileSummaryClass =/)
  assert.match(profileModal, /const profileMetaTextClass =/)
  assert.match(profileModal, /const profileMetaInputClass =/)
  assert.match(profileModal, /const profileBirthdayInputClass =/)
  assert.match(profileModal, /petAge[\s\S]*formatPetAge/)
  assert.match(profileModal, /v-if="petAge !== '-'"/)
  assert.match(profileModal, /h-36 w-36/)
  assert.match(profileModal, /shrink-0/)
  assert.match(profileModal, /md:h-40 md:w-40/)
  assert.match(profileModal, /grid-cols-1/)
  assert.match(profileModal, /auto-rows-max/)
  assert.match(profileModal, /md:grid-cols/)
  assert.match(profileModal, /md:auto-rows-auto/)
  assert.match(profileModal, /min-h-0[\s\S]*md:min-h-0/)
  assert.match(profileModal, /overflow-visible[\s\S]*md:overflow-y-auto/)
  assert.match(profileModal, /mt-6 w-full space-y-2/)
  assert.match(profileModal, /text-3xl font-bold tracking-wide text-brand-navy/)
  assert.match(profileModal, /text-base font-medium text-brand-gray/)
  assert.match(profileModal, /text-center/)
  assert.match(profileModal, /text-3xl/)
  assert.match(profileModal, /text-center text-base/)
  assert.match(profileModal, /profileGenderSelectClass/)
  assert.match(profileModal, /\[text-align-last:center\]/)
  assert.match(profileModal, /profileBirthdayInputClass/)
  assert.doesNotMatch(profileModal, /isEditingProfile \? 'mt-4 space-y-0\.5' : 'mt-6 space-y-1'/)
  assert.doesNotMatch(profileModal, /isEditingProfile \? 'h-32 w-32 md:h-36 md:w-36'/)
})
