import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  hospitalMapQuerySchema,
  hospitalsQuerySchema,
  nearbyHospitalsQuerySchema,
} from '../src/schemas/hospitals.schema.js'

test('醫院清單 schema 應支援 24H 與排序並要求距離座標', () => {
  const valid = hospitalsQuerySchema.safeParse({ is_24h: 'true', sort: 'distance', lat: '25', lng: '121' })
  assert.equal(valid.success, true)
  assert.equal(valid.data.is_24h, true)
  assert.equal(hospitalsQuerySchema.safeParse({ sort: 'distance' }).success, false)
})

test('地圖 bounds schema 應驗證方向與數值', () => {
  assert.equal(hospitalMapQuerySchema.safeParse({ north: 26, south: 24, east: 122, west: 120 }).success, true)
  const invalid = hospitalMapQuerySchema.safeParse({ north: 24, south: 26, east: 122, west: 120 })
  assert.equal(invalid.success, false)
  assert.equal(invalid.error.issues[0].message, '北側緯度必須大於南側緯度')
})

test('醫院清單 query schema 應套用預設分頁並修剪字串條件', () => {
  const result = hospitalsQuerySchema.safeParse({
    keyword: ' 仁愛 ',
    city: ' 台北市 ',
    district: ' 大安區 ',
    animal_type: ' cat ',
  })

  assert.equal(result.success, true)
  assert.deepEqual(result.data, {
    keyword: '仁愛',
    city: '台北市',
    district: '大安區',
    animal_type: 'cat',
    page: 1,
    limit: 20,
  })
})

test('醫院清單 query schema 應轉換 page 與 limit', () => {
  const result = hospitalsQuerySchema.safeParse({ page: '2', limit: '10' })

  assert.equal(result.success, true)
  assert.equal(result.data.page, 2)
  assert.equal(result.data.limit, 10)
})

test('醫院清單 query schema 應拒絕無效 page 與超過上限的 limit', () => {
  const pageResult = hospitalsQuerySchema.safeParse({ page: '0' })
  const limitResult = hospitalsQuerySchema.safeParse({ limit: '101' })

  assert.equal(pageResult.success, false)
  assert.equal(pageResult.error.issues[0]?.message, '頁碼必須大於 0')
  assert.equal(limitResult.success, false)
  assert.equal(limitResult.error.issues[0]?.message, '每頁筆數不可超過 100')
})

test('醫院清單 query schema 應拒絕格式錯誤的 animal_type', () => {
  const result = hospitalsQuerySchema.safeParse({ animal_type: '貓' })

  assert.equal(result.success, false)
  assert.equal(result.error.issues[0]?.message, '診療動物種類格式不正確')
})

test('附近醫院 query schema 應要求並轉換 lat 與 lng', () => {
  const result = nearbyHospitalsQuerySchema.safeParse({
    lat: '25.033',
    lng: '121.5654',
  })

  assert.equal(result.success, true)
  assert.deepEqual(result.data, {
    lat: 25.033,
    lng: 121.5654,
    radius: 5,
    limit: 20,
  })
})

test('附近醫院 query schema 應套用 radius 與 limit 上限', () => {
  const radiusResult = nearbyHospitalsQuerySchema.safeParse({
    lat: '25',
    lng: '121',
    radius: '51',
  })
  const limitResult = nearbyHospitalsQuerySchema.safeParse({
    lat: '25',
    lng: '121',
    limit: '101',
  })

  assert.equal(radiusResult.success, false)
  assert.equal(radiusResult.error.issues[0]?.message, '搜尋半徑不可超過 50 公里')
  assert.equal(limitResult.success, false)
  assert.equal(limitResult.error.issues[0]?.message, '每頁筆數不可超過 100')
})

test('附近醫院 query schema 應拒絕缺少或越界的座標', () => {
  const missingResult = nearbyHospitalsQuerySchema.safeParse({ lng: '121' })
  const latResult = nearbyHospitalsQuerySchema.safeParse({ lat: '91', lng: '121' })
  const lngResult = nearbyHospitalsQuerySchema.safeParse({ lat: '25', lng: '181' })

  assert.equal(missingResult.success, false)
  assert.equal(missingResult.error.issues[0]?.message, '緯度格式不正確')
  assert.equal(latResult.success, false)
  assert.equal(latResult.error.issues[0]?.message, '緯度必須介於 -90 到 90 之間')
  assert.equal(lngResult.success, false)
  assert.equal(lngResult.error.issues[0]?.message, '經度必須介於 -180 到 180 之間')
})
