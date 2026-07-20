import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  applyEnrichmentUpdates,
  addressCity,
  buildDiscoveryUpdatePlan,
  classifyAlwaysOpen,
  discoverAlwaysOpenPlaces,
  enrichHospital24h,
  GOOGLE_PLACE_DETAILS_BASE_URL,
  GOOGLE_PLACES_TEXT_SEARCH_URL,
  PLACE_DETAILS_FIELD_MASK,
  parseCliArgs,
  PLACES_TEXT_SEARCH_FIELD_MASK,
  matchPlaceToHospital,
  normalizeCity,
  normalizePhone,
  refreshLinkedPlaces,
  SELECT_TARGET_HOSPITALS_SQL,
  TARGET_CITIES,
  UPDATE_HOSPITAL_ENRICHMENT_SQL,
  runHospital24hCli,
} from '../database/scripts/enrich_hospital_24h.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

const canonicalPeriod = {
  open: { day: 0, hour: 0, minute: 0 },
}

const scheduledPeriods = Array.from({ length: 7 }, (_, day) => ({
  open: { day, hour: 9, minute: 0 },
  close: { day, hour: 21, minute: 0 },
}))

test('canonical Google periods 以規格表格產生 true、false 或 indeterminate', () => {
  const examples = [
    [{ businessStatus: 'OPERATIONAL', regularOpeningHours: { periods: [canonicalPeriod] } }, true],
    [{ businessStatus: 'OPERATIONAL', regularOpeningHours: { periods: scheduledPeriods } }, false],
    [{
      businessStatus: 'OPERATIONAL',
      regularOpeningHours: { periods: [{ open: { day: 1, hour: 8, minute: 0 } }] },
    }, null],
    [{ businessStatus: 'OPERATIONAL' }, null],
    [{ businessStatus: 'CLOSED_TEMPORARILY', regularOpeningHours: { periods: [canonicalPeriod] } }, null],
  ]

  for (const [place, expected] of examples) {
    assert.equal(classifyAlwaysOpen(place), expected)
  }
})

test('canonical Google periods 不從 openNow、文字或不完整 periods 推論 24H', () => {
  assert.equal(classifyAlwaysOpen({
    businessStatus: 'OPERATIONAL',
    displayName: { text: '24 小時動物醫院' },
    regularOpeningHours: { openNow: true, weekdayDescriptions: ['24 小時營業'] },
  }), null)
  assert.equal(classifyAlwaysOpen({
    businessStatus: 'OPERATIONAL',
    regularOpeningHours: { periods: [{ open: { day: 0, hour: 0 } }] },
  }), null)
})

test('城市與台灣電話會正規化', () => {
  assert.equal(normalizeCity('臺北市'), '台北市')
  assert.equal(normalizeCity(' 新北市 '), '新北市')
  assert.equal(normalizePhone('+886 2 2272 8119'), '0222728119')
  assert.equal(normalizePhone('(02) 2272-8119'), '0222728119')
  assert.equal(normalizePhone('  '), null)
  assert.equal(addressCity('新北市台北市路 1 號'), '新北市')
})

test('只配對同城市且電話唯一的官方醫院', () => {
  const hospitals = [
    { id: 1, city: '新北市', phone: '(02) 2272-8119' },
    { id: 2, city: '台北市', phone: '02-2272-8119' },
  ]
  const place = {
    formattedAddress: '220 新北市板橋區測試路 1 號',
    nationalPhoneNumber: '+886 2 2272 8119',
  }

  assert.deepEqual(matchPlaceToHospital(place, '新北市', hospitals), {
    status: 'matched',
    hospital: hospitals[0],
  })
  assert.deepEqual(matchPlaceToHospital(place, '台北市', hospitals), {
    status: 'outside_city',
  })
})

test('無電話、無配對與同城市多筆電話皆不寫入', () => {
  const basePlace = { formattedAddress: '新北市板橋區測試路 1 號' }

  assert.deepEqual(matchPlaceToHospital(basePlace, '新北市', []), { status: 'unmatched' })
  assert.deepEqual(matchPlaceToHospital(
    { ...basePlace, nationalPhoneNumber: '02-2272-8119' },
    '新北市',
    [{ id: 1, city: '新北市', phone: '02-0000-0000' }],
  ), { status: 'unmatched' })

  const duplicates = [
    { id: 1, city: '新北市', phone: '02-2272-8119' },
    { id: 2, city: '新北市', phone: '+886 2 2272 8119' },
  ]
  assert.deepEqual(matchPlaceToHospital(
    { ...basePlace, nationalPhoneNumber: '02-2272-8119' },
    '新北市',
    duplicates,
  ), { status: 'ambiguous' })
})

test('discovery 查詢固定三市、跟隨分頁並以 Place ID 去重', async () => {
  const requests = []
  const responses = [
    {
      places: [
        {
          id: 'taipei-24h',
          businessStatus: 'OPERATIONAL',
          formattedAddress: '台北市信義區測試路 1 號',
          nationalPhoneNumber: '02-1111-1111',
          regularOpeningHours: { periods: [canonicalPeriod] },
        },
        {
          id: 'cross-city-duplicate',
          businessStatus: 'OPERATIONAL',
          formattedAddress: '新北市板橋區測試路 3 號',
          regularOpeningHours: { periods: [canonicalPeriod] },
        },
      ],
      nextPageToken: 'taipei-page-2',
    },
    {
      places: [
        {
          id: 'taipei-24h',
          businessStatus: 'OPERATIONAL',
          formattedAddress: '台北市信義區測試路 1 號',
          nationalPhoneNumber: '02-1111-1111',
          regularOpeningHours: { periods: [canonicalPeriod] },
        },
        {
          id: 'taipei-scheduled',
          businessStatus: 'OPERATIONAL',
          formattedAddress: '台北市大安區測試路 2 號',
          regularOpeningHours: { periods: scheduledPeriods },
        },
      ],
    },
    {
      places: [
        {
          id: 'new-taipei-24h',
          businessStatus: 'OPERATIONAL',
          formattedAddress: '臺北市跨城市路 3 號',
          regularOpeningHours: { periods: [canonicalPeriod] },
        },
        {
          id: 'cross-city-duplicate',
          businessStatus: 'OPERATIONAL',
          formattedAddress: '新北市板橋區測試路 3 號',
          regularOpeningHours: { periods: [canonicalPeriod] },
        },
      ],
    },
    { places: [] },
  ]
  const axiosClient = {
    post: async (url, body, options) => {
      requests.push({ url, body, options })
      return { data: responses.shift() }
    },
  }

  const result = await discoverAlwaysOpenPlaces({ axiosClient, apiKey: 'places-key' })

  assert.deepEqual(requests.map(({ body }) => body.textQuery), [
    '台北市 動物醫院',
    '台北市 動物醫院',
    '新北市 動物醫院',
    '基隆市 動物醫院',
  ])
  assert.deepEqual(requests.map(({ body }) => body.pageToken ?? null), [
    null,
    'taipei-page-2',
    null,
    null,
  ])
  for (const { url, body, options } of requests) {
    assert.equal(url, GOOGLE_PLACES_TEXT_SEARCH_URL)
    assert.equal(body.includedType, 'veterinary_care')
    assert.equal(body.strictTypeFiltering, true)
    assert.equal(body.languageCode, 'zh-TW')
    assert.equal(body.regionCode, 'TW')
    assert.equal(options.headers['X-Goog-Api-Key'], 'places-key')
    assert.equal(options.headers['X-Goog-FieldMask'], PLACES_TEXT_SEARCH_FIELD_MASK)
  }
  assert.deepEqual(TARGET_CITIES, ['台北市', '新北市', '基隆市'])
  assert.deepEqual(result.stats, { queried: 4, fetched: 6, alwaysOpen: 2 })
  assert.deepEqual(result.candidates.map(({ place, queriedCity }) => [place.id, queriedCity]), [
    ['taipei-24h', '台北市'],
    ['cross-city-duplicate', '新北市'],
  ])
})

test('Text Search 省略空 places 時視為零候選並繼續三市流程', async () => {
  const requests = []
  let transactionStarted = false
  const pool = {
    query: async () => ({ rows: [] }),
    connect: async () => {
      transactionStarted = true
      throw new Error('must not connect')
    },
  }
  const axiosClient = {
    post: async (_url, body) => {
      requests.push(body.textQuery)
      return { data: {} }
    },
  }

  const stats = await enrichHospital24h({
    pool,
    axiosClient,
    env: { GOOGLE_PLACES_API_KEY: 'places-key' },
    logger: { info: () => {} },
    write: true,
  })

  assert.deepEqual(requests, [
    '台北市 動物醫院',
    '新北市 動物醫院',
    '基隆市 動物醫院',
  ])
  assert.deepEqual(stats, {
    queried: 3,
    fetched: 0,
    alwaysOpen: 0,
    matched: 0,
    unmatched: 0,
    ambiguous: 0,
    conflicts: 0,
    refreshed: 0,
    wouldUpdate: 0,
    updated: 0,
  })
  assert.equal(transactionStarted, false)
})

test('Text Search places 存在但不是陣列時仍拒絕回應', async () => {
  const axiosClient = {
    post: async () => ({ data: { places: null } }),
  }

  await assert.rejects(
    () => discoverAlwaysOpenPlaces({ axiosClient, apiKey: 'places-key' }),
    /Text Search response is invalid/,
  )
})

test('discovery plan 分類 matched、unmatched、ambiguous 與 Place ID conflict', () => {
  const hospitals = [
    { id: 1, city: '台北市', phone: '02-1111-1111', google_place_id: null },
    { id: 2, city: '台北市', phone: '02-2222-2222', google_place_id: 'linked-place' },
    { id: 3, city: '台北市', phone: '02-3333-3333', google_place_id: null },
    { id: 4, city: '台北市', phone: '02-3333-3333', google_place_id: null },
    { id: 5, city: '台北市', phone: '02-5555-5555', google_place_id: null },
  ]
  const candidates = [
    ['new-place', '02-1111-1111'],
    ['missing-place', '02-9999-9999'],
    ['ambiguous-place', '02-3333-3333'],
    ['linked-place', '02-5555-5555'],
  ].map(([id, phone]) => ({
    queriedCity: '台北市',
    place: {
      id,
      formattedAddress: '台北市信義區測試路 1 號',
      nationalPhoneNumber: phone,
    },
  }))

  const result = buildDiscoveryUpdatePlan({ candidates, hospitals })

  assert.deepEqual(result.stats, {
    matched: 1,
    unmatched: 1,
    ambiguous: 1,
    conflicts: 1,
  })
  assert.deepEqual(result.updates, [{
    hospitalId: 1,
    placeId: 'new-place',
    is24h: true,
  }])
})

test('既有連結不重新配對，同一醫院不產生多筆 discovery update', () => {
  const hospitals = [
    { id: 1, city: '新北市', phone: '02-1111-1111', google_place_id: 'existing-place' },
    { id: 2, city: '新北市', phone: '02-2222-2222', google_place_id: null },
  ]
  const makeCandidate = (id, phone) => ({
    queriedCity: '新北市',
    place: {
      id,
      formattedAddress: '新北市板橋區測試路 1 號',
      nationalPhoneNumber: phone,
    },
  })

  const result = buildDiscoveryUpdatePlan({
    hospitals,
    candidates: [
      makeCandidate('existing-place', '02-1111-1111'),
      makeCandidate('first-new-place', '02-2222-2222'),
      makeCandidate('second-new-place', '02-2222-2222'),
    ],
  })

  assert.deepEqual(result.updates, [{
    hospitalId: 2,
    placeId: 'first-new-place',
    is24h: true,
  }])
  assert.deepEqual(result.stats, { matched: 1, unmatched: 0, ambiguous: 0, conflicts: 1 })
})

test('Place Details refresh 可將已連結醫院從 true 更新為 false', async () => {
  const requests = []
  const hospitals = [
    { id: 1, city: '台北市', is_24h: true, google_place_id: 'linked-place' },
    { id: 2, city: '台中市', is_24h: true, google_place_id: 'out-of-scope' },
  ]
  const axiosClient = {
    get: async (url, options) => {
      requests.push({ url, options })
      return {
        data: {
          id: 'linked-place',
          businessStatus: 'OPERATIONAL',
          regularOpeningHours: { periods: scheduledPeriods },
        },
      }
    },
  }

  const result = await refreshLinkedPlaces({ hospitals, axiosClient, apiKey: 'places-key' })

  assert.deepEqual(result, {
    updates: [{ hospitalId: 1, placeId: 'linked-place', is24h: false }],
    refreshed: 1,
  })
  assert.equal(requests[0].url, `${GOOGLE_PLACE_DETAILS_BASE_URL}/linked-place`)
  assert.equal(requests[0].options.headers['X-Goog-Api-Key'], 'places-key')
  assert.equal(requests[0].options.headers['X-Goog-FieldMask'], PLACE_DETAILS_FIELD_MASK)
})

test('indeterminate Details 與 Text Search 缺席不改變已連結狀態', async () => {
  const hospitals = [
    { id: 1, city: '基隆市', is_24h: true, google_place_id: 'missing-periods' },
    { id: 2, city: '基隆市', is_24h: true, google_place_id: 'closed-place' },
  ]
  const responses = [
    { id: 'missing-periods', businessStatus: 'OPERATIONAL' },
    {
      id: 'closed-place',
      businessStatus: 'CLOSED_TEMPORARILY',
      regularOpeningHours: { periods: [canonicalPeriod] },
    },
  ]
  const axiosClient = { get: async () => ({ data: responses.shift() }) }

  const result = await refreshLinkedPlaces({ hospitals, axiosClient, apiKey: 'places-key' })

  assert.deepEqual(result, { updates: [], refreshed: 0 })
})

test('非 canonical 且缺少 close 的 Details 保留已連結狀態與檢查時間', async () => {
  const originalCheckedAt = new Date('2026-07-01T00:00:00.000Z')
  const hospitals = [{
    id: 1,
    city: '基隆市',
    is_24h: true,
    is_24h_checked_at: originalCheckedAt,
    google_place_id: 'incomplete-period',
  }]
  const originalHospitals = structuredClone(hospitals)
  const axiosClient = {
    get: async () => ({
      data: {
        id: 'incomplete-period',
        businessStatus: 'OPERATIONAL',
        regularOpeningHours: {
          periods: [{ open: { day: 1, hour: 8, minute: 0 } }],
        },
      },
    }),
  }

  const result = await refreshLinkedPlaces({ hospitals, axiosClient, apiKey: 'places-key' })

  assert.deepEqual(result, { updates: [], refreshed: 0 })
  assert.deepEqual(hospitals, originalHospitals)
})

test('Details 省略 businessStatus 時保留狀態並繼續後續 linked hospital', async () => {
  const originalCheckedAt = new Date('2026-07-01T00:00:00.000Z')
  const hospitals = [
    {
      id: 1,
      city: '基隆市',
      is_24h: true,
      is_24h_checked_at: originalCheckedAt,
      google_place_id: 'missing-business-status',
    },
    {
      id: 2,
      city: '基隆市',
      is_24h: true,
      is_24h_checked_at: originalCheckedAt,
      google_place_id: 'scheduled-place',
    },
  ]
  const originalHospitals = structuredClone(hospitals)
  const requestedPlaceIds = []
  const responses = [
    { id: 'missing-business-status', regularOpeningHours: { periods: [canonicalPeriod] } },
    {
      id: 'scheduled-place',
      businessStatus: 'OPERATIONAL',
      regularOpeningHours: { periods: scheduledPeriods },
    },
  ]
  const axiosClient = {
    get: async (url) => {
      requestedPlaceIds.push(url.split('/').at(-1))
      return { data: responses.shift() }
    },
  }

  const result = await refreshLinkedPlaces({ hospitals, axiosClient, apiKey: 'places-key' })

  assert.deepEqual(requestedPlaceIds, ['missing-business-status', 'scheduled-place'])
  assert.deepEqual(result, {
    updates: [{ hospitalId: 2, placeId: 'scheduled-place', is24h: false }],
    refreshed: 1,
  })
  assert.deepEqual(hospitals, originalHospitals)
})

test('dry-run 只讀取醫院並輸出完整決策統計', async () => {
  const queries = []
  const logs = []
  const pool = {
    query: async (text, values) => {
      queries.push({ text, values })
      return {
        rows: [{
          id: 1,
          city: '台北市',
          phone: '02-1111-1111',
          is_24h: null,
          google_place_id: null,
        }],
      }
    },
  }
  let requestCount = 0
  const axiosClient = {
    post: async () => {
      requestCount += 1
      return {
        data: {
          places: requestCount === 1 ? [{
            id: 'new-place',
            businessStatus: 'OPERATIONAL',
            formattedAddress: '台北市信義區測試路 1 號',
            nationalPhoneNumber: '02-1111-1111',
            regularOpeningHours: { periods: [canonicalPeriod] },
          }] : [],
        },
      }
    },
    get: async () => {
      throw new Error('dry-run test has no linked place')
    },
  }

  const stats = await enrichHospital24h({
    pool,
    axiosClient,
    env: { GOOGLE_PLACES_API_KEY: 'places-key' },
    logger: { info: (message) => logs.push(message) },
  })

  assert.deepEqual(stats, {
    queried: 3,
    fetched: 1,
    alwaysOpen: 1,
    matched: 1,
    unmatched: 0,
    ambiguous: 0,
    conflicts: 0,
    refreshed: 0,
    wouldUpdate: 1,
    updated: 0,
  })
  assert.equal(queries.length, 1)
  assert.equal(queries[0].text, SELECT_TARGET_HOSPITALS_SQL)
  assert.deepEqual(queries[0].values, [TARGET_CITIES])
  assert.doesNotMatch(queries[0].text, /UPDATE|BEGIN|COMMIT/i)
  for (const key of Object.keys(stats)) assert.match(logs[0], new RegExp(`${key}=${stats[key]}`))
})

test('write mode 在 Google 評估後以單一 transaction 更新並 commit', async () => {
  const events = []
  const checkedAt = new Date('2026-07-17T01:02:03.000Z')
  const client = {
    query: async (text, values) => {
      events.push({ type: 'sql', text, values })
      return { rowCount: 1 }
    },
    release: () => events.push({ type: 'release' }),
  }
  const pool = {
    query: async () => ({
      rows: [{ id: 1, city: '台北市', phone: '02-1111-1111', google_place_id: null }],
    }),
    connect: async () => {
      events.push({ type: 'connect' })
      return client
    },
  }
  let requestCount = 0
  const axiosClient = {
    post: async () => {
      events.push({ type: 'google' })
      requestCount += 1
      return { data: { places: requestCount === 1 ? [{
        id: 'new-place',
        businessStatus: 'OPERATIONAL',
        formattedAddress: '台北市信義區測試路 1 號',
        nationalPhoneNumber: '02-1111-1111',
        regularOpeningHours: { periods: [canonicalPeriod] },
      }] : [] } }
    },
  }

  const stats = await enrichHospital24h({
    pool,
    axiosClient,
    env: { GOOGLE_PLACES_API_KEY: 'places-key' },
    logger: { info: () => {} },
    clock: () => checkedAt,
    write: true,
  })

  const sqlEvents = events.filter(({ type }) => type === 'sql')
  assert.deepEqual(sqlEvents.map(({ text }) => text), [
    'BEGIN',
    UPDATE_HOSPITAL_ENRICHMENT_SQL,
    'COMMIT',
  ])
  assert.deepEqual(sqlEvents[1].values, [true, 'new-place', checkedAt, 1])
  assert.ok(events.findIndex(({ type }) => type === 'connect') > events.findLastIndex(({ type }) => type === 'google'))
  assert.equal(stats.wouldUpdate, 1)
  assert.equal(stats.updated, 1)
  assert.equal(events.at(-1).type, 'release')
})

test('write mode 任一 UPDATE 失敗時 rollback 並傳遞非零失敗', async () => {
  const events = []
  let updateCount = 0
  const client = {
    query: async (text) => {
      events.push(text)
      if (text === UPDATE_HOSPITAL_ENRICHMENT_SQL && ++updateCount === 2) {
        throw new Error('second update failed')
      }
      return { rowCount: 1 }
    },
    release: () => events.push('RELEASE'),
  }
  const pool = {
    query: async () => ({ rows: [
      { id: 1, city: '台北市', phone: '02-1111-1111', google_place_id: null },
      { id: 2, city: '台北市', phone: '02-2222-2222', google_place_id: null },
    ] }),
    connect: async () => client,
  }
  let requestCount = 0
  const axiosClient = {
    post: async () => {
      requestCount += 1
      return { data: { places: requestCount === 1 ? [
        {
          id: 'place-1',
          businessStatus: 'OPERATIONAL',
          formattedAddress: '台北市信義區測試路 1 號',
          nationalPhoneNumber: '02-1111-1111',
          regularOpeningHours: { periods: [canonicalPeriod] },
        },
        {
          id: 'place-2',
          businessStatus: 'OPERATIONAL',
          formattedAddress: '台北市信義區測試路 2 號',
          nationalPhoneNumber: '02-2222-2222',
          regularOpeningHours: { periods: [canonicalPeriod] },
        },
      ] : [] } }
    },
  }

  await assert.rejects(
    () => enrichHospital24h({
      pool,
      axiosClient,
      env: { GOOGLE_PLACES_API_KEY: 'places-key' },
      logger: { info: () => {} },
      write: true,
    }),
    /second update failed/,
  )
  assert.deepEqual(events, [
    'BEGIN',
    UPDATE_HOSPITAL_ENRICHMENT_SQL,
    UPDATE_HOSPITAL_ENRICHMENT_SQL,
    'ROLLBACK',
    'RELEASE',
  ])
})

test('write mode 找不到預期醫院列時不得靜默計為 updated', async () => {
  const events = []
  const client = {
    query: async (text) => {
      events.push(text)
      return { rowCount: text === UPDATE_HOSPITAL_ENRICHMENT_SQL ? 0 : null }
    },
    release: () => events.push('RELEASE'),
  }

  await assert.rejects(
    () => applyEnrichmentUpdates({ connect: async () => client }, [
      { hospitalId: 99, placeId: 'missing-hospital', is24h: true },
    ], new Date('2026-07-17T01:02:03.000Z')),
    /affected 0 rows for id=99/,
  )
  assert.deepEqual(events, ['BEGIN', UPDATE_HOSPITAL_ENRICHMENT_SQL, 'ROLLBACK', 'RELEASE'])
})

test('缺少 GOOGLE_PLACES_API_KEY 時不讀取資料庫、不呼叫 Google 也不開 transaction', async () => {
  let databaseCalled = false
  let googleCalled = false
  const pool = {
    query: async () => {
      databaseCalled = true
      return { rows: [] }
    },
    connect: async () => {
      databaseCalled = true
      throw new Error('must not connect')
    },
  }
  const axiosClient = {
    post: async () => {
      googleCalled = true
      return { data: { places: [] } }
    },
  }

  await assert.rejects(
    () => enrichHospital24h({
      pool,
      axiosClient,
      env: {},
      logger: { info: () => {} },
      write: true,
    }),
    /GOOGLE_PLACES_API_KEY is required/,
  )
  assert.equal(databaseCalled, false)
  assert.equal(googleCalled, false)
})

test('Text Search 授權失敗時在 transaction 前終止', async () => {
  let transactionStarted = false
  const pool = {
    query: async () => ({ rows: [] }),
    connect: async () => {
      transactionStarted = true
      throw new Error('must not connect')
    },
  }
  const axiosClient = {
    post: async () => {
      throw new Error('Google Places authorization failed')
    },
  }

  await assert.rejects(
    () => enrichHospital24h({
      pool,
      axiosClient,
      env: { GOOGLE_PLACES_API_KEY: 'invalid-key' },
      logger: { info: () => {} },
      write: true,
    }),
    /authorization failed/,
  )
  assert.equal(transactionStarted, false)
})

test('Place Details response shape 錯誤時在 transaction 前終止', async () => {
  let transactionStarted = false
  const pool = {
    query: async () => ({ rows: [
      { id: 1, city: '台北市', phone: '02-1111-1111', google_place_id: 'linked-place' },
    ] }),
    connect: async () => {
      transactionStarted = true
      throw new Error('must not connect')
    },
  }
  const axiosClient = {
    post: async () => ({ data: { places: [] } }),
    get: async () => ({ data: { businessStatus: 'OPERATIONAL' } }),
  }

  await assert.rejects(
    () => enrichHospital24h({
      pool,
      axiosClient,
      env: { GOOGLE_PLACES_API_KEY: 'places-key' },
      logger: { info: () => {} },
      write: true,
    }),
    /Place Details response is invalid/,
  )
  assert.equal(transactionStarted, false)
})

test('package script 與 env example 提供 24H enrichment 操作入口', () => {
  const packageJson = JSON.parse(readProjectFile('package.json'))
  const envExample = readProjectFile('.env.example')

  assert.equal(
    packageJson.scripts['db:enrich:hospitals:24h'],
    'node database/scripts/enrich_hospital_24h.js',
  )
  assert.match(envExample, /^GOOGLE_PLACES_API_KEY=your_google_places_api_key$/m)
})

test('CLI 只允許 --write，預設為 dry-run', () => {
  assert.deepEqual(parseCliArgs([]), { write: false })
  assert.deepEqual(parseCliArgs(['--write']), { write: true })
  assert.throws(() => parseCliArgs(['--force']), /Unknown argument: --force/)
  assert.throws(() => parseCliArgs(['--write', '--write']), /may only be provided once/)
})

test('CLI helper 失敗時仍會關閉 pool 並把錯誤傳給 main', async () => {
  let ended = false
  const pool = {
    query: async () => ({ rows: [] }),
    end: async () => { ended = true },
  }

  await assert.rejects(
    () => runHospital24hCli({
      argv: [],
      createPool: () => pool,
      env: {},
      logger: { info: () => {} },
    }),
    /GOOGLE_PLACES_API_KEY is required/,
  )
  assert.equal(ended, true)

  const script = readProjectFile('database/scripts/enrich_hospital_24h.js')
  assert.match(script, /process\.exitCode = 1/)
  assert.doesNotMatch(script, /writeFile|createWriteStream|appendFile/)
  assert.doesNotMatch(UPDATE_HOSPITAL_ENRICHMENT_SQL, /display|address|phone|period|response/i)
})
