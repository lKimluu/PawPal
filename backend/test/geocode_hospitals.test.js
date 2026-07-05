import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  fetchHospitalsMissingCoordinates,
  geocodeAddress,
  geocodeHospitals,
  GeocodingRequestDeniedError,
  GOOGLE_GEOCODING_URL,
  SELECT_HOSPITALS_MISSING_COORDINATES_SQL,
  updateHospitalCoordinates,
  UPDATE_HOSPITAL_COORDINATES_SQL,
} from '../database/scripts/geocode_hospitals.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function makeLogger() {
  const messages = {
    info: [],
    warn: [],
    error: [],
  }

  return {
    messages,
    logger: {
      info: (message) => messages.info.push(message),
      warn: (message) => messages.warn.push(message),
      error: (message) => messages.error.push(message),
    },
  }
}

test('geocode_hospitals：應匯出可測試介面', () => {
  assert.equal(typeof fetchHospitalsMissingCoordinates, 'function')
  assert.equal(typeof geocodeAddress, 'function')
  assert.equal(typeof updateHospitalCoordinates, 'function')
  assert.equal(typeof geocodeHospitals, 'function')
})

test('fetchHospitalsMissingCoordinates：只查詢缺少完整座標的醫院並依 id 排序', async () => {
  const calls = []
  const pool = {
    query: async (text) => {
      calls.push(text)

      return {
        rows: [
          { id: 1, name: 'A 動物醫院', address: '台北市信義區市府路1號' },
        ],
      }
    },
  }

  const rows = await fetchHospitalsMissingCoordinates(pool)

  assert.deepEqual(rows, [
    { id: 1, name: 'A 動物醫院', address: '台北市信義區市府路1號' },
  ])
  assert.equal(calls.length, 1)
  assert.match(SELECT_HOSPITALS_MISSING_COORDINATES_SQL, /SELECT id, name, address/)
  assert.match(SELECT_HOSPITALS_MISSING_COORDINATES_SQL, /latitude IS NULL/)
  assert.match(SELECT_HOSPITALS_MISSING_COORDINATES_SQL, /OR longitude IS NULL/)
  assert.match(SELECT_HOSPITALS_MISSING_COORDINATES_SQL, /ORDER BY id/)
})

test('geocodeHospitals：已有完整座標的醫院不會被查詢後送到 Google API', async () => {
  const seenRequests = []
  const pool = {
    query: async () => ({ rows: [] }),
  }
  const axiosClient = {
    get: async (url, options) => {
      seenRequests.push({ url, options })

      return { data: { status: 'OK', results: [] } }
    },
  }

  const stats = await geocodeHospitals({
    pool,
    axiosClient,
    logger: makeLogger().logger,
    env: { GOOGLE_GEOCODING_API_KEY: 'test-key' },
  })

  assert.deepEqual(stats, {
    total: 0,
    processed: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  })
  assert.deepEqual(seenRequests, [])
})

test('geocodeHospitals：缺少 GOOGLE_GEOCODING_API_KEY 時不查詢資料庫', async () => {
  let queryCalled = false
  const pool = {
    query: async () => {
      queryCalled = true

      return { rows: [] }
    },
  }

  await assert.rejects(
    () => geocodeHospitals({
      pool,
      logger: makeLogger().logger,
      env: {},
    }),
    /GOOGLE_GEOCODING_API_KEY is required/,
  )
  assert.equal(queryCalled, false)
})

test('geocodeAddress：應呼叫 Google Geocoding API 並解析第一筆座標', async () => {
  const seenRequests = []
  const axiosClient = {
    get: async (url, options) => {
      seenRequests.push({ url, options })

      return {
        data: {
          status: 'OK',
          results: [
            {
              geometry: {
                location: {
                  lat: 25.033964,
                  lng: 121.564468,
                },
              },
            },
          ],
        },
      }
    },
  }

  const coordinates = await geocodeAddress('台北市信義區市府路1號', {
    apiKey: 'test-key',
    axiosClient,
  })

  assert.deepEqual(coordinates, {
    latitude: 25.033964,
    longitude: 121.564468,
  })
  assert.equal(seenRequests[0].url, GOOGLE_GEOCODING_URL)
  assert.deepEqual(seenRequests[0].options.params, {
    address: '台北市信義區市府路1號',
    key: 'test-key',
  })
})

test('geocodeAddress：REQUEST_DENIED 應丟出可辨識的 batch-level error', async () => {
  const axiosClient = {
    get: async () => ({
      data: {
        status: 'REQUEST_DENIED',
        error_message: 'API keys with referer restrictions cannot be used',
        results: [],
      },
    }),
  }

  await assert.rejects(
    () => geocodeAddress('台北市信義區市府路1號', {
      apiKey: 'test-key',
      axiosClient,
    }),
    (error) => {
      assert.ok(error instanceof GeocodingRequestDeniedError)
      assert.equal(error.geocodingStatus, 'REQUEST_DENIED')
      assert.match(error.message, /REQUEST_DENIED/)
      assert.match(error.message, /referer restrictions/)

      return true
    },
  )
})

test('updateHospitalCoordinates：應只更新指定醫院座標與 updated_at', async () => {
  const calls = []
  const pool = {
    query: async (text, values) => {
      calls.push({ text, values })
    },
  }

  await updateHospitalCoordinates(pool, 42, {
    latitude: 25.033964,
    longitude: 121.564468,
  })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].text, UPDATE_HOSPITAL_COORDINATES_SQL)
  assert.deepEqual(calls[0].values, [25.033964, 121.564468, 42])
  assert.match(UPDATE_HOSPITAL_COORDINATES_SQL, /SET latitude = \$1/)
  assert.match(UPDATE_HOSPITAL_COORDINATES_SQL, /longitude = \$2/)
  assert.match(UPDATE_HOSPITAL_COORDINATES_SQL, /updated_at = CURRENT_TIMESTAMP/)
  assert.match(UPDATE_HOSPITAL_COORDINATES_SQL, /WHERE id = \$3/)
})

test('geocodeHospitals：成功取得座標時應更新對應醫院', async () => {
  const queries = []
  const pool = {
    query: async (text, values) => {
      queries.push({ text, values })

      if (text === SELECT_HOSPITALS_MISSING_COORDINATES_SQL) {
        return {
          rows: [
            { id: 42, name: '測試動物醫院', address: '台北市信義區市府路1號' },
          ],
        }
      }

      return { rowCount: 1 }
    },
  }
  const axiosClient = {
    get: async () => ({
      data: {
        status: 'OK',
        results: [
          {
            geometry: {
              location: {
                lat: 25.033964,
                lng: 121.564468,
              },
            },
          },
        ],
      },
    }),
  }

  const stats = await geocodeHospitals({
    pool,
    axiosClient,
    logger: makeLogger().logger,
    env: { GOOGLE_GEOCODING_API_KEY: 'test-key' },
  })

  assert.deepEqual(stats, {
    total: 1,
    processed: 1,
    updated: 1,
    skipped: 0,
    failed: 0,
  })
  assert.equal(queries[1].text, UPDATE_HOSPITAL_COORDINATES_SQL)
  assert.deepEqual(queries[1].values, [25.033964, 121.564468, 42])
})

test('geocodeHospitals：ZERO_RESULTS 或缺少 usable location 時不更新座標', async () => {
  const queries = []
  const pool = {
    query: async (text, values) => {
      queries.push({ text, values })

      return {
        rows: [
          { id: 7, name: '查無座標醫院', address: '不存在地址' },
          { id: 8, name: '缺少座標醫院', address: '台北市測試路1號' },
        ],
      }
    },
  }
  const responses = [
    { data: { status: 'ZERO_RESULTS', results: [] } },
    { data: { status: 'OK', results: [{ geometry: { location: {} } }] } },
  ]
  const axiosClient = {
    get: async () => responses.shift(),
  }

  const stats = await geocodeHospitals({
    pool,
    axiosClient,
    logger: makeLogger().logger,
    env: { GOOGLE_GEOCODING_API_KEY: 'test-key' },
  })

  assert.deepEqual(stats, {
    total: 2,
    processed: 2,
    updated: 0,
    skipped: 2,
    failed: 0,
  })
  assert.equal(queries.length, 1)
})

test('geocodeHospitals：單筆 API 失敗時應記錄並繼續處理下一筆', async () => {
  const queries = []
  const { logger, messages } = makeLogger()
  const pool = {
    query: async (text, values) => {
      queries.push({ text, values })

      if (text === SELECT_HOSPITALS_MISSING_COORDINATES_SQL) {
        return {
          rows: [
            { id: 10, name: '失敗動物醫院', address: '台北市錯誤路1號' },
            { id: 11, name: '成功動物醫院', address: '台北市信義區市府路1號' },
          ],
        }
      }

      return { rowCount: 1 }
    },
  }
  const axiosClient = {
    get: async (_url, options) => {
      if (options.params.address === '台北市錯誤路1號') {
        throw new Error('quota exceeded')
      }

      return {
        data: {
          status: 'OK',
          results: [
            {
              geometry: {
                location: {
                  lat: 25.033964,
                  lng: 121.564468,
                },
              },
            },
          ],
        },
      }
    },
  }

  const stats = await geocodeHospitals({
    pool,
    axiosClient,
    logger,
    env: { GOOGLE_GEOCODING_API_KEY: 'test-key' },
  })

  assert.deepEqual(stats, {
    total: 2,
    processed: 2,
    updated: 1,
    skipped: 0,
    failed: 1,
  })
  assert.match(messages.error[0], /id=10/)
  assert.match(messages.error[0], /失敗動物醫院/)
  assert.match(messages.error[0], /台北市錯誤路1號/)
  assert.equal(queries[1].text, UPDATE_HOSPITAL_COORDINATES_SQL)
  assert.deepEqual(queries[1].values, [25.033964, 121.564468, 11])
})

test('geocodeHospitals：REQUEST_DENIED 應停止後續請求且不更新座標', async () => {
  const queries = []
  const seenRequests = []
  const { logger, messages } = makeLogger()
  const pool = {
    query: async (text, values) => {
      queries.push({ text, values })

      if (text === SELECT_HOSPITALS_MISSING_COORDINATES_SQL) {
        return {
          rows: [
            { id: 10, name: '權限失敗動物醫院', address: '台北市錯誤路1號' },
            { id: 11, name: '不應處理動物醫院', address: '台北市信義區市府路1號' },
          ],
        }
      }

      return { rowCount: 1 }
    },
  }
  const axiosClient = {
    get: async (url, options) => {
      seenRequests.push({ url, options })

      return {
        data: {
          status: 'REQUEST_DENIED',
          error_message: 'This API project is not authorized',
          results: [],
        },
      }
    },
  }

  await assert.rejects(
    () => geocodeHospitals({
      pool,
      axiosClient,
      logger,
      env: { GOOGLE_GEOCODING_API_KEY: 'test-key' },
    }),
    /REQUEST_DENIED.*not authorized/,
  )

  assert.equal(seenRequests.length, 1)
  assert.deepEqual(seenRequests[0].options.params, {
    address: '台北市錯誤路1號',
    key: 'test-key',
  })
  assert.equal(queries.length, 1)
  assert.match(messages.error[0], /REQUEST_DENIED/)
  assert.match(messages.error[0], /id=10/)
  assert.match(messages.error[0], /權限失敗動物醫院/)
  assert.match(messages.error[0], /台北市錯誤路1號/)
  assert.match(messages.error[0], /not authorized/)
})

test('geocodeHospitals：REQUEST_DENIED 前已完成的座標更新應保留並停止第三筆', async () => {
  const queries = []
  const seenRequests = []
  const { logger } = makeLogger()
  const pool = {
    query: async (text, values) => {
      queries.push({ text, values })

      if (text === SELECT_HOSPITALS_MISSING_COORDINATES_SQL) {
        return {
          rows: [
            { id: 9, name: '成功動物醫院', address: '台北市信義區市府路1號' },
            { id: 10, name: '權限失敗動物醫院', address: '台北市錯誤路1號' },
            { id: 11, name: '不應處理動物醫院', address: '新北市板橋區測試路1號' },
          ],
        }
      }

      return { rowCount: 1 }
    },
  }
  const axiosClient = {
    get: async (url, options) => {
      seenRequests.push({ url, options })

      if (options.params.address === '台北市信義區市府路1號') {
        return {
          data: {
            status: 'OK',
            results: [
              {
                geometry: {
                  location: {
                    lat: 25.033964,
                    lng: 121.564468,
                  },
                },
              },
            ],
          },
        }
      }

      return {
        data: {
          status: 'REQUEST_DENIED',
          error_message: 'Geocoding API has not been used',
          results: [],
        },
      }
    },
  }

  await assert.rejects(
    () => geocodeHospitals({
      pool,
      axiosClient,
      logger,
      env: { GOOGLE_GEOCODING_API_KEY: 'test-key' },
    }),
    /REQUEST_DENIED.*Geocoding API has not been used/,
  )

  assert.equal(seenRequests.length, 2)
  assert.deepEqual(
    seenRequests.map((request) => request.options.params.address),
    ['台北市信義區市府路1號', '台北市錯誤路1號'],
  )
  assert.equal(queries[1].text, UPDATE_HOSPITAL_COORDINATES_SQL)
  assert.deepEqual(queries[1].values, [25.033964, 121.564468, 9])
  assert.equal(
    queries.filter((query) => query.text === UPDATE_HOSPITAL_COORDINATES_SQL).length,
    1,
  )
})

test('geocodeHospitals：缺少地址時應跳過且不呼叫 Google API', async () => {
  const seenRequests = []
  const { logger, messages } = makeLogger()
  const pool = {
    query: async () => ({
      rows: [
        { id: 5, name: '無地址動物醫院', address: '   ' },
      ],
    }),
  }
  const axiosClient = {
    get: async (url, options) => {
      seenRequests.push({ url, options })

      return { data: { status: 'OK', results: [] } }
    },
  }

  const stats = await geocodeHospitals({
    pool,
    axiosClient,
    logger,
    env: { GOOGLE_GEOCODING_API_KEY: 'test-key' },
  })

  assert.deepEqual(stats, {
    total: 1,
    processed: 0,
    updated: 0,
    skipped: 1,
    failed: 0,
  })
  assert.deepEqual(seenRequests, [])
  assert.match(messages.warn[0], /id=5/)
  assert.match(messages.warn[0], /無地址動物醫院/)
})

test('geocodeHospitals：應記錄批次統計', async () => {
  const { logger, messages } = makeLogger()
  const pool = {
    query: async () => ({
      rows: [
        { id: 1, name: '無地址動物醫院', address: null },
      ],
    }),
  }

  const stats = await geocodeHospitals({
    pool,
    axiosClient: { get: async () => ({ data: { status: 'ZERO_RESULTS' } }) },
    logger,
    env: { GOOGLE_GEOCODING_API_KEY: 'test-key' },
  })

  assert.deepEqual(stats, {
    total: 1,
    processed: 0,
    updated: 0,
    skipped: 1,
    failed: 0,
  })
  assert.match(
    messages.info[0],
    /total=1, processed=0, updated=0, skipped=1, failed=0/,
  )
})

test('geocode_hospitals main：應只在直接執行腳本時啟動', () => {
  const script = readProjectFile('database/scripts/geocode_hospitals.js')

  assert.match(script, /process\.argv\[1\] === fileURLToPath\(import\.meta\.url\)/)
  assert.match(script, /process\.exitCode = 1/)
})

test('package scripts 與 env example：應提供明確 geocoding 指令與 Google key', () => {
  const packageJson = JSON.parse(readProjectFile('package.json'))
  const envExample = readProjectFile('.env.example')

  assert.equal(
    packageJson.scripts['db:geocode:hospitals'],
    'node database/scripts/geocode_hospitals.js',
  )
  assert.match(envExample, /GOOGLE_GEOCODING_API_KEY=/)
})
