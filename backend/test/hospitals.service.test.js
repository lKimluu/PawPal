import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pool } from '../src/config/db.js'
import { findHospitalRegions, findHospitals, findMapHospitals, findNearbyHospitals } from '../src/services/hospitals.service.js'

test('findHospitals 應套用 keyword、地區、animal_type 與分頁條件', async (t) => {
  const rows = [
    {
      id: 1,
      name: '仁愛動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區仁愛路',
      phone: '02-1234-5678',
      latitude: '25.0330000',
      longitude: '121.5654000',
      rating_average: '4.5',
      review_count: 2,
      animal_types: [{ slug: 'cat', name: '貓', verification_status: 'verified', source: 'manual' }],
    },
  ]
  const query = t.mock.method(pool, 'query', async (text, values) => {
    if (query.mock.callCount() === 0) {
      assert.match(text, /COUNT\(\*\)::int AS total/)
      assert.match(text, /h\.name ILIKE \$1/)
      assert.match(text, /h\.city ILIKE \$1/)
      assert.match(text, /h\.district ILIKE \$1/)
      assert.match(text, /h\.address ILIKE \$1/)
      assert.match(text, /h\.city = \$2/)
      assert.match(text, /h\.district = \$3/)
      assert.match(text, /at_filter\.slug = \$4/)
      assert.deepEqual(values, ['%仁%', '台北市', '大安區', 'cat'])
      return { rows: [{ total: 11 }] }
    }

    assert.match(text, /LEFT JOIN LATERAL/)
    assert.match(text, /AVG\(rating\)/)
    assert.match(text, /COUNT\(\*\)::int AS review_count/)
    assert.match(text, /LEFT JOIN hospital_animal_types hat/)
    assert.match(text, /ORDER BY h\.id ASC/)
    assert.match(text, /LIMIT \$5/)
    assert.match(text, /OFFSET \$6/)
    assert.deepEqual(values, ['%仁%', '台北市', '大安區', 'cat', 10, 10])
    return { rows }
  })

  const result = await findHospitals({
    keyword: '仁',
    city: '台北市',
    district: '大安區',
    animal_type: 'cat',
    page: 2,
    limit: 10,
  })

  assert.equal(query.mock.callCount(), 2)
  assert.deepEqual(result.pagination, {
    page: 2,
    limit: 10,
    total: 11,
    total_pages: 2,
  })
  assert.deepEqual(result.hospitals, [
    {
      id: 1,
      name: '仁愛動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區仁愛路',
      phone: '02-1234-5678',
      latitude: 25.033,
      longitude: 121.5654,
      rating_average: 4.5,
      average_rating: 4.5,
      rating: 4.5,
      review_count: 2,
      animal_types: [
        { slug: 'cat', name: '貓', verification_status: 'verified', source: 'manual' },
      ],
    },
  ])
})

test('findHospitals keyword 應可搜尋 district 且不需要前端推論欄位', async (t) => {
  const rows = [
    {
      id: 1,
      name: '安心動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區和平東路',
      phone: '02-3333-3333',
      latitude: null,
      longitude: null,
      rating_average: null,
      average_rating: 0,
      rating: 0,
      review_count: 0,
      animal_types: [],
    },
  ]
  const query = t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /h\.name ILIKE \$1/)
    assert.match(text, /h\.city ILIKE \$1/)
    assert.match(text, /h\.district ILIKE \$1/)
    assert.match(text, /h\.address ILIKE \$1/)

    if (query.mock.callCount() === 0) {
      assert.deepEqual(values, ['%大安%'])
      return { rows: [{ total: 1 }] }
    }

    assert.deepEqual(values, ['%大安%', 20, 0])
    return { rows }
  })

  const result = await findHospitals({
    keyword: '大安',
    page: 1,
    limit: 20,
  })

  assert.equal(query.mock.callCount(), 2)
  assert.deepEqual(result.hospitals, [
    {
      id: 1,
      name: '安心動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區和平東路',
      phone: '02-3333-3333',
      latitude: null,
      longitude: null,
      rating_average: null,
      average_rating: 0,
      rating: 0,
      review_count: 0,
      animal_types: [],
    },
  ])
  assert.deepEqual(result.pagination, {
    page: 1,
    limit: 20,
    total: 1,
    total_pages: 1,
  })
})

test('findHospitals keyword 應可搜尋 address 且保留分頁資訊', async (t) => {
  const rows = [
    {
      id: 2,
      name: '仁愛毛孩醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區仁愛路1號',
      phone: '02-4444-4444',
      latitude: '25.0320000',
      longitude: '121.5430000',
      rating_average: '5.0',
      review_count: 1,
      animal_types: [],
    },
  ]
  const query = t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /h\.address ILIKE \$1/)

    if (query.mock.callCount() === 0) {
      assert.deepEqual(values, ['%仁愛路%'])
      return { rows: [{ total: 1 }] }
    }

    assert.deepEqual(values, ['%仁愛路%', 10, 10])
    return { rows }
  })

  const result = await findHospitals({
    keyword: '仁愛路',
    page: 2,
    limit: 10,
  })

  assert.equal(query.mock.callCount(), 2)
  assert.deepEqual(result.hospitals, [
    {
      id: 2,
      name: '仁愛毛孩醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區仁愛路1號',
      phone: '02-4444-4444',
      latitude: 25.032,
      longitude: 121.543,
      rating_average: 5,
      average_rating: 5,
      rating: 5,
      review_count: 1,
      animal_types: [],
    },
  ])
  assert.deepEqual(result.pagination, {
    page: 2,
    limit: 10,
    total: 1,
    total_pages: 1,
  })
})

test('findHospitals keyword relevance 排序應使用正確 SQL 參數順序', async (t) => {
  const rows = [
    {
      id: 3,
      name: '小尾巴動物醫院',
      city: '新北市',
      district: '淡水區',
      address: '新北市淡水區新市三路',
      phone: '02-5555-5555',
      latitude: '25.1880000',
      longitude: '121.4440000',
      rating_average: null,
      review_count: 0,
      animal_types: [],
    },
  ]
  const query = t.mock.method(pool, 'query', async (text, values) => {
    if (query.mock.callCount() === 0) {
      assert.deepEqual(values, ['%小尾巴%'])
      return { rows: [{ total: 1 }] }
    }

    assert.match(text, /WHEN h\.name ILIKE '%' \|\| \$2 \|\| '%' THEN 0/)
    assert.match(text, /LIMIT \$3/)
    assert.match(text, /OFFSET \$4/)
    assert.deepEqual(values, ['%小尾巴%', '小尾巴', 20, 0])
    return { rows }
  })

  const result = await findHospitals({
    keyword: '小尾巴',
    sort: 'relevance',
    page: 1,
    limit: 20,
  })

  assert.equal(query.mock.callCount(), 2)
  assert.deepEqual(result.hospitals, [
    {
      id: 3,
      name: '小尾巴動物醫院',
      city: '新北市',
      district: '淡水區',
      address: '新北市淡水區新市三路',
      phone: '02-5555-5555',
      latitude: 25.188,
      longitude: 121.444,
      rating_average: null,
      average_rating: 0,
      rating: 0,
      review_count: 0,
      animal_types: [],
    },
  ])
})

test('findHospitals 無符合資料時應回傳空陣列與分頁資訊', async (t) => {
  t.mock.method(pool, 'query', async () => {
    if (pool.query.mock.callCount() === 0) {
      return { rows: [{ total: 0 }] }
    }

    return { rows: [] }
  })

  const result = await findHospitals({ page: 1, limit: 20 })

  assert.deepEqual(result, {
    hospitals: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      total_pages: 0,
    },
  })
})

test('findHospitals 已登入時應在每筆醫院附上 is_favorite', async (t) => {
  const rows = [
    {
      id: 1,
      name: '仁愛動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區仁愛路',
      phone: '02-1234-5678',
      latitude: '25.0330000',
      longitude: '121.5654000',
      rating_average: '4.5',
      review_count: 2,
      animal_types: [],
      is_favorite: true,
    },
  ]
  const query = t.mock.method(pool, 'query', async (text, values) => {
    if (query.mock.callCount() === 0) {
      assert.deepEqual(values, [])
      return { rows: [{ total: 1 }] }
    }

    assert.match(text, /EXISTS \(\s*SELECT 1\s*FROM hospital_favorites hf\s*WHERE hf\.hospital_id = h\.id\s*AND hf\.user_id = \$1\s*\) AS is_favorite/)
    assert.deepEqual(values, [7, 20, 0])
    return { rows }
  })

  const result = await findHospitals({ page: 1, limit: 20 }, { userId: 7 })

  assert.equal(query.mock.callCount(), 2)
  assert.equal(result.hospitals[0].is_favorite, true)
})

test('findHospitals favorites_only 應只回傳目前使用者已收藏的醫院', async (t) => {
  const rows = [
    {
      id: 1,
      name: '仁愛動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區仁愛路',
      phone: '02-1234-5678',
      latitude: '25.0330000',
      longitude: '121.5654000',
      rating_average: '4.5',
      review_count: 2,
      animal_types: [],
      is_favorite: true,
    },
  ]
  const query = t.mock.method(pool, 'query', async (text, values) => {
    if (query.mock.callCount() === 0) {
      assert.match(text, /EXISTS \(\s*SELECT 1\s*FROM hospital_favorites hf_filter\s*WHERE hf_filter\.hospital_id = h\.id\s*AND hf_filter\.user_id = \$1\s*\)/)
      assert.deepEqual(values, [7])
      return { rows: [{ total: 1 }] }
    }

    assert.deepEqual(values, [7, 20, 0])
    return { rows }
  })

  const result = await findHospitals({ favorites_only: true, page: 1, limit: 20 }, { userId: 7 })

  assert.equal(query.mock.callCount(), 2)
  assert.deepEqual(result.hospitals.map((hospital) => hospital.id), [1])
  assert.equal(result.hospitals[0].is_favorite, true)
})

test('findHospitals favorites_only 可與 is_24h 等既有篩選共同套用', async (t) => {
  const query = t.mock.method(pool, 'query', async (text, values) => {
    if (query.mock.callCount() === 0) {
      assert.match(text, /h\.is_24h = \$1/)
      assert.match(text, /hf_filter\.user_id = \$2/)
      assert.deepEqual(values, [true, 7])
      return { rows: [{ total: 0 }] }
    }

    assert.deepEqual(values, [true, 7, 20, 0])
    return { rows: [] }
  })

  const result = await findHospitals(
    { favorites_only: true, is_24h: true, page: 1, limit: 20 },
    { userId: 7 },
  )

  assert.equal(query.mock.callCount(), 2)
  assert.deepEqual(result.hospitals, [])
})

test('findHospitals 未登入時不應回傳 is_favorite 欄位', async (t) => {
  const rows = [
    {
      id: 1,
      name: '仁愛動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區仁愛路',
      phone: '02-1234-5678',
      latitude: '25.0330000',
      longitude: '121.5654000',
      rating_average: '4.5',
      review_count: 2,
      animal_types: [],
    },
  ]
  t.mock.method(pool, 'query', async (text) => {
    assert.doesNotMatch(text, /is_favorite/)
    if (pool.query.mock.callCount() === 0) return { rows: [{ total: 1 }] }
    return { rows }
  })

  const result = await findHospitals({ page: 1, limit: 20 })

  assert.equal(result.hospitals[0].is_favorite, undefined)
})

test('findNearbyHospitals 應使用座標、半徑、limit 與距離排序查詢', async (t) => {
  const rows = [
    {
      id: 1,
      name: 'A 動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區',
      phone: '02-1111-1111',
      latitude: '25.0330000',
      longitude: '121.5654000',
      distance_km: '1.234',
      rating_average: '4.0',
      review_count: 2,
      animal_types: [{ slug: 'dog', name: '狗', verification_status: 'verified', source: null }],
    },
    {
      id: 2,
      name: 'B 動物醫院',
      city: '台北市',
      district: '信義區',
      address: '台北市信義區',
      phone: '02-2222-2222',
      latitude: '25.0400000',
      longitude: '121.5700000',
      distance_km: '3.4',
      rating_average: null,
      review_count: 0,
      animal_types: [],
    },
  ]
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /h\.latitude IS NOT NULL/)
    assert.match(text, /h\.longitude IS NOT NULL/)
    assert.match(text, /RADIANS\(h\.latitude::double precision\)/)
    assert.match(text, /LEFT JOIN LATERAL/)
    assert.match(text, /AVG\(rating\)/)
    assert.match(text, /nearby\.distance_km <= \$3/)
    assert.match(text, /ORDER BY nearby\.distance_km ASC/)
    assert.match(text, /LIMIT \$4/)
    assert.deepEqual(values, [25.033, 121.5654, 5, 20])
    return { rows }
  })

  const hospitals = await findNearbyHospitals({
    lat: 25.033,
    lng: 121.5654,
    radius: 5,
    limit: 20,
  })

  assert.deepEqual(hospitals, [
    {
      id: 1,
      name: 'A 動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區',
      phone: '02-1111-1111',
      latitude: 25.033,
      longitude: 121.5654,
      rating_average: 4,
      average_rating: 4,
      rating: 4,
      review_count: 2,
      animal_types: [{ slug: 'dog', name: '狗', verification_status: 'verified', source: null }],
      distance_km: 1.23,
    },
    {
      id: 2,
      name: 'B 動物醫院',
      city: '台北市',
      district: '信義區',
      address: '台北市信義區',
      phone: '02-2222-2222',
      latitude: 25.04,
      longitude: 121.57,
      rating_average: null,
      average_rating: 0,
      rating: 0,
      review_count: 0,
      animal_types: [],
      distance_km: 3.4,
    },
  ])
})

test('findNearbyHospitals 應支援 nearby animal_type slug 篩選', async (t) => {
  t.mock.method(pool, 'query', async (text, values) => {
    assert.match(text, /at_filter\.slug = \$3/)
    assert.match(text, /nearby\.distance_km <= \$4/)
    assert.match(text, /LIMIT \$5/)
    assert.deepEqual(values, [25, 121, 'dog', 10, 5])
    return { rows: [] }
  })

  const hospitals = await findNearbyHospitals({
    lat: 25,
    lng: 121,
    animal_type: 'dog',
    radius: 10,
    limit: 5,
  })

  assert.deepEqual(hospitals, [])
})

test('findHospitalRegions 應回傳穩定地區 shape', async (t) => {
  t.mock.method(pool, 'query', async (text) => {
    assert.match(text, /array_agg\(DISTINCT district ORDER BY district\)/)
    return { rows: [{ city: '台北市', districts: ['大安區', '信義區'] }] }
  })
  assert.deepEqual(await findHospitalRegions(), [{ city: '台北市', districts: ['大安區', '信義區'] }])
})

test('findMapHospitals 應限制 bounds 結果並回傳評分聚合', async (t) => {
  const rows = [
    {
      id: 1,
      name: 'A 動物醫院',
      city: '台北市',
      district: '大安區',
      address: '台北市大安區',
      phone: '02-1111-1111',
      latitude: '25.0330000',
      longitude: '121.5654000',
      rating_average: '4.0',
      review_count: 2,
      animal_types: [],
    },
  ]
  const query = t.mock.method(pool, 'query', async (text, values) => {
    assert.deepEqual(values, [24, 26, 120, 122])
    if (query.mock.callCount() === 0) return { rows: [{ total: 1001 }] }
    assert.match(text, /LEFT JOIN LATERAL/)
    assert.match(text, /AVG\(rating\)/)
    assert.match(text, /LIMIT 1000/)
    return { rows }
  })
  assert.deepEqual(await findMapHospitals({ north: 26, south: 24, east: 122, west: 120 }), {
    hospitals: [
      {
        id: 1,
        name: 'A 動物醫院',
        city: '台北市',
        district: '大安區',
        address: '台北市大安區',
        phone: '02-1111-1111',
        latitude: 25.033,
        longitude: 121.5654,
        rating_average: 4,
        average_rating: 4,
        rating: 4,
        review_count: 2,
        animal_types: [],
      },
    ],
    total: 1001,
    truncated: true,
  })
})
