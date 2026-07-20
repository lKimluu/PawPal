import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pool } from '../src/config/db.js'
import {
  addHospitalFavorite,
  DuplicateHospitalFavoriteError,
  HospitalFavoriteNotFoundError,
  HospitalNotFoundError,
  removeHospitalFavorite,
} from '../src/services/hospital_favorites.service.js'

test('addHospitalFavorite 新增收藏成功', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /INSERT INTO hospital_favorites/)
    assert.deepEqual(values, [15, 7])
    return { rows: [] }
  })

  await assert.doesNotReject(() => addHospitalFavorite(15, 7))
})

test('addHospitalFavorite 重複收藏時應拋出 DuplicateHospitalFavoriteError', async (t) => {
  t.mock.method(pool, 'query', async () => {
    const error = new Error('duplicate')
    error.code = '23505'
    error.constraint = 'uq_hospital_favorites_user_hospital'
    throw error
  })

  await assert.rejects(() => addHospitalFavorite(15, 7), DuplicateHospitalFavoriteError)
})

test('addHospitalFavorite 醫院不存在時應拋出 HospitalNotFoundError', async (t) => {
  t.mock.method(pool, 'query', async () => {
    const error = new Error('missing hospital')
    error.code = '23503'
    error.constraint = 'fk_hospital_favorites_hospital'
    throw error
  })

  await assert.rejects(() => addHospitalFavorite(999, 7), HospitalNotFoundError)
})

test('removeHospitalFavorite 移除收藏成功', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /DELETE FROM hospital_favorites/)
    assert.match(text, /WHERE hospital_id = \$1/)
    assert.match(text, /AND user_id = \$2/)
    assert.deepEqual(values, [15, 7])
    return { rowCount: 1 }
  })

  assert.equal(await removeHospitalFavorite(15, 7), true)
})

test('removeHospitalFavorite 收藏不存在時應拋出 HospitalFavoriteNotFoundError', async (t) => {
  t.mock.method(pool, 'query', async () => ({ rowCount: 0 }))

  await assert.rejects(() => removeHospitalFavorite(15, 7), HospitalFavoriteNotFoundError)
})
