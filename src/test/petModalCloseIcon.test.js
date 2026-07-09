import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const addPetModal = readFileSync(
  new URL('../components/pet/AddPetModal.vue', import.meta.url),
  'utf8',
)

const petProfileModal = readFileSync(
  new URL('../components/pet/PetProfileModal.vue', import.meta.url),
  'utf8',
)

test('新增與修改寵物 modal 右上角關閉按鈕使用相同叉叉符號', () => {
  assert.match(addPetModal, /@click="handleClose"[\s\S]*>\s*⨉\s*<\/button>/)
  assert.match(petProfileModal, /@click="handleClose"[\s\S]*>\s*⨉\s*<\/button>/)
  assert.doesNotMatch(addPetModal, /@click="handleClose"[\s\S]*>\s*x\s*<\/button>/)
})
