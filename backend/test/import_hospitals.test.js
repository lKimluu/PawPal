import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { SEED_FILES_IN_ORDER, TABLES_IN_ORDER } from '../scripts/setup-db.js'
import {
  clearSeedData,
  DELETE_SEED_CALENDAR_EVENTS_SQL,
  DELETE_SEED_GROWTH_RECORDS_SQL,
  DELETE_SEED_MEDICAL_RECORDS_SQL,
  DELETE_SEED_PETS_SQL,
  DELETE_SEED_USERS_SQL,
  SEED_EMAILS,
  SEED_MICROCHIP_NUMBERS,
} from '../scripts/clear-seed.js'
import {
  fetchMoaHospitalRows,
  hospitalValues,
  importHospitals,
  MOA_HOSPITALS_DETAIL_URL,
  MOA_HOSPITALS_URL,
  MOA_REQUEST_TIMEOUT_MS,
  normalizeHospitalRow,
  UPSERT_HOSPITAL_SQL,
} from '../database/scripts/import_hospitals.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const CANONICAL_ANIMAL_TYPES = [
  ['狗', 'dog'],
  ['貓', 'cat'],
  ['兔', 'rabbit'],
  ['鼠類', 'rodent'],
  ['鳥類', 'bird'],
  ['爬蟲類', 'reptile'],
  ['兩棲類', 'amphibian'],
  ['其他特殊寵物', 'other_exotic'],
]

function makeRows(count, status = '開業') {
  return Array.from({ length: count }, (_, index) => ({
    縣市: '宜蘭縣',
    字號: `測試字第${index}號`,
    狀態: status,
    機構名稱: `測試動物醫院${index}`,
    機構電話: '(03)1234567',
    機構地址: '宜蘭縣宜蘭市測試路1號',
  }))
}

function makeOfficialHospitalRow(overrides = {}) {
  return {
    縣市: '宜蘭縣',
    字號: '九三府農畜字第40682號',
    執照類別: '獸醫佐',
    狀態: '開業',
    機構名稱: ' 季廷動物醫院 ',
    負責獸醫: '蔡季庭',
    機構電話: '(039)533111',
    發照日期: '20040405',
    機構地址: '宜蘭縣羅東鎮中山路2段415號',
    ...overrides,
  }
}

function makeAxiosClient(responseData, seenRequests = []) {
  return {
    get: async (url, options) => {
      seenRequests.push({ url, options })

      return { data: responseData }
    },
  }
}

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertNoUnqualifiedDelete(sql) {
  const matches = [...sql.matchAll(/DELETE\s+FROM\s+[a-z_]+/gi)]

  for (const match of matches) {
    const statement = sql.slice(match.index, sql.indexOf(';', match.index) + 1)

    assert.match(statement, /\bWHERE\b|\bUSING\b/)
  }
}

test('hospitals schema：應建立官方醫院資料欄位與唯一執照字號', () => {
  const schema = readProjectFile('database/schema/hospitals.sql')

  assert.match(schema, /CREATE TABLE IF NOT EXISTS hospitals/)
  assert.match(schema, /license_number VARCHAR\(100\) NOT NULL UNIQUE/)
  assert.match(schema, /latitude NUMERIC\(10,7\)/)
  assert.match(schema, /longitude NUMERIC\(10,7\)/)
  assert.match(schema, /is_24h BOOLEAN/)
  assert.match(schema, /emergency_available BOOLEAN/)
  assert.match(schema, /trigger_hospitals_updated_at/)
  assert.match(schema, /idx_hospitals_city_district/)
  assert.match(schema, /idx_hospitals_name/)
  assert.doesNotMatch(schema, /license_type/)
  assert.doesNotMatch(schema, /responsible_vet/)
  assert.doesNotMatch(schema, /issued_date/)
})

test('setup-db：資料表建立順序應包含 hospitals', () => {
  assert.ok(TABLES_IN_ORDER.includes('hospitals'))
})

test('setup-db：應只執行 schema 且不得刪除既有資料表', () => {
  const setupScript = readProjectFile('scripts/setup-db.js')

  assert.doesNotMatch(setupScript, /DROP\s+TABLE/i)
  assert.deepEqual(TABLES_IN_ORDER.slice(-4), [
    'hospitals',
    'animal_types',
    'hospital_animal_types',
    'hospital_reviews',
  ])
  assert.deepEqual(SEED_FILES_IN_ORDER, [
    'users',
    'pets',
    'calendar_events',
    'medical_records',
    'growth_records',
    'animal_types.seed',
  ])
  assert.ok(!SEED_FILES_IN_ORDER.includes('hospitals'))
  assert.ok(!SEED_FILES_IN_ORDER.includes('hospital_reviews'))
})

test('animal_types schema：應建立固定動物種類 reference data 結構', () => {
  const schema = readProjectFile('database/schema/animal_types.sql')

  assert.match(schema, /CREATE TABLE IF NOT EXISTS animal_types/)
  assert.match(schema, /id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY/)
  assert.match(schema, /name VARCHAR\(50\) NOT NULL UNIQUE/)
  assert.match(schema, /slug VARCHAR\(50\) NOT NULL UNIQUE/)
  assert.match(schema, /created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP/)
})

test('animal_types seed：應固定建立 8 種 canonical 動物分類且可重跑', () => {
  const seedSql = readProjectFile('database/seeds/animal_types.seed.sql')

  assert.doesNotMatch(seedSql, /TRUNCATE|DELETE\s+FROM/i)
  assert.match(seedSql, /INSERT INTO animal_types/)
  assert.match(seedSql, /ON CONFLICT \(slug\) DO NOTHING/)

  for (const [name, slug] of CANONICAL_ANIMAL_TYPES) {
    assert.match(seedSql, new RegExp(`'${name}',\\s*'${slug}'`))
  }

  const valueRows = [...seedSql.matchAll(/\('([^']+)',\s*'([^']+)'\)/g)]

  assert.equal(valueRows.length, CANONICAL_ANIMAL_TYPES.length)
  assert.deepEqual(
    valueRows.map((match) => [match[1], match[2]]),
    CANONICAL_ANIMAL_TYPES,
  )
})

test('hospital_animal_types schema：應建立醫院與動物種類多對多關聯', () => {
  const schema = readProjectFile('database/schema/hospital_animal_types.sql')

  assert.match(schema, /CREATE TABLE IF NOT EXISTS hospital_animal_types/)
  assert.match(schema, /hospital_id INTEGER NOT NULL/)
  assert.match(schema, /animal_type_id INTEGER NOT NULL/)
  assert.match(schema, /created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP/)
  assert.match(schema, /FOREIGN KEY \(hospital_id\)/)
  assert.match(schema, /REFERENCES hospitals\(id\)/)
  assert.match(schema, /FOREIGN KEY \(animal_type_id\)/)
  assert.match(schema, /REFERENCES animal_types\(id\)/)
  assert.match(schema, /UNIQUE \(hospital_id, animal_type_id\)/)
  assert.match(schema, /idx_hospital_animal_types_hospital_id/)
  assert.match(schema, /idx_hospital_animal_types_animal_type_id/)
})

test('hospital_animal_types schema：應記錄驗證狀態與來源且不表示不支援診療', () => {
  const schema = readProjectFile('database/schema/hospital_animal_types.sql')
  const seedSql = readProjectFile('database/seeds/animal_types.seed.sql')

  assert.match(schema, /verification_status VARCHAR\(30\) NOT NULL DEFAULT 'unverified'/)
  assert.match(schema, /CONSTRAINT chk_hospital_animal_types_verification_status/)
  assert.match(
    schema,
    /CHECK \(verification_status IN \('unverified', 'verified', 'rejected'\)\)/,
  )
  assert.match(schema, /source TEXT/)
  assert.doesNotMatch(schema, /unsupported|not_supported|does_not_treat|is_supported/i)
  assert.doesNotMatch(seedSql, /hospital_animal_types/)
})

test('hospital_animal_types schema：應支援雙向 join 查詢契約', () => {
  const schema = readProjectFile('database/schema/hospital_animal_types.sql')

  assert.match(schema, /hospital_id INTEGER NOT NULL/)
  assert.match(schema, /animal_type_id INTEGER NOT NULL/)
  assert.match(schema, /UNIQUE \(hospital_id, animal_type_id\)/)
  assert.match(schema, /idx_hospital_animal_types_hospital_id/)
  assert.match(schema, /idx_hospital_animal_types_animal_type_id/)
})

test('hospital_reviews schema：應建立會員醫院評論與心數評分契約', () => {
  const schema = readProjectFile('database/schema/hospital_reviews.sql')

  assert.match(schema, /CREATE TABLE IF NOT EXISTS hospital_reviews/)
  assert.match(schema, /id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY/)
  assert.match(schema, /hospital_id INTEGER NOT NULL/)
  assert.match(schema, /user_id INTEGER NOT NULL/)
  assert.match(schema, /rating SMALLINT NOT NULL/)
  assert.match(schema, /comment TEXT NOT NULL/)
  assert.match(schema, /created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP/)
  assert.match(schema, /updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP/)
  assert.match(schema, /CONSTRAINT fk_hospital_reviews_hospital/)
  assert.match(schema, /REFERENCES hospitals\(id\)/)
  assert.match(schema, /CONSTRAINT fk_hospital_reviews_user/)
  assert.match(schema, /REFERENCES users\(id\)/)
  assert.match(schema, /CONSTRAINT chk_hospital_reviews_rating/)
  assert.match(schema, /CHECK \(rating BETWEEN 1 AND 5\)/)
  assert.match(schema, /CONSTRAINT chk_hospital_reviews_comment/)
  assert.match(schema, /char_length\(trim\(comment\)\) BETWEEN 1 AND 1000/)
  assert.match(schema, /CONSTRAINT uq_hospital_reviews_user_hospital/)
  assert.match(schema, /UNIQUE \(user_id, hospital_id\)/)
  assert.match(schema, /idx_hospital_reviews_hospital_id/)
  assert.match(schema, /idx_hospital_reviews_user_id/)
  assert.match(schema, /idx_hospital_reviews_hospital_created_at/)
})

test('schema：所有 CREATE TABLE 都應使用 IF NOT EXISTS', () => {
  const schemaDir = path.join(projectRoot, 'database/schema')
  const schemaFiles = fs
    .readdirSync(schemaDir)
    .filter((fileName) => fileName.endsWith('.sql'))

  for (const fileName of schemaFiles) {
    const schema = readProjectFile(`database/schema/${fileName}`)

    assert.doesNotMatch(schema, /CREATE\s+TABLE(?!\s+IF\s+NOT\s+EXISTS)/i)
  }
})

test('enum schema：不得使用 DROP TYPE CASCADE，應以 duplicate_object 安全建立', () => {
  const calendarEventsSchema = readProjectFile('database/schema/calendar_events.sql')
  const growthRecordsSchema = readProjectFile('database/schema/growth_records.sql')

  for (const schema of [calendarEventsSchema, growthRecordsSchema]) {
    assert.doesNotMatch(schema, /DROP\s+TYPE[\s\S]*CASCADE/i)
    assert.match(schema, /DO\s+\$\$\s+BEGIN/i)
    assert.match(schema, /CREATE\s+TYPE/i)
    assert.match(schema, /duplicate_object/i)
  }
})

test('seed SQL：不得清空資料，且重複執行不應重複插入子表資料', () => {
  const calendarEventsSeed = readProjectFile('database/seeds/calendar_events.sql')
  const medicalRecordsSeed = readProjectFile('database/seeds/medical_records.sql')
  const growthRecordsSeed = readProjectFile('database/seeds/growth_records.sql')

  for (const seedSql of [calendarEventsSeed, medicalRecordsSeed, growthRecordsSeed]) {
    assert.doesNotMatch(seedSql, /TRUNCATE/i)
    assert.match(seedSql, /WHERE\s+NOT\s+EXISTS/i)
    assert.match(seedSql, /microchip_number/i)
  }

  assert.match(calendarEventsSeed, /users\.email\s+=\s+cal\.owner_email/)
  assert.match(medicalRecordsSeed, /users\.email\s+=\s+record\.owner_email/)
})

test('package scripts：應提供明確醫院匯入指令且 db:setup 不隱含匯入', () => {
  const packageJson = JSON.parse(
    readProjectFile('package.json'),
  )

  assert.equal(
    packageJson.scripts['db:import:hospitals'],
    'node database/scripts/import_hospitals.js',
  )
  assert.equal(packageJson.scripts['db:setup'], 'node scripts/setup-db.js')
  assert.equal(packageJson.scripts['db:seed:clear'], 'node scripts/clear-seed.js')
  assert.doesNotMatch(packageJson.scripts['db:setup'], /import_hospitals|importHospitals/)
})

test('clear-seed：應使用精準條件且不得破壞 hospitals 或整張表', () => {
  const clearSeedScript = readProjectFile('scripts/clear-seed.js')

  assert.doesNotMatch(clearSeedScript, /DROP\s+TABLE/i)
  assert.doesNotMatch(clearSeedScript, /TRUNCATE/i)
  assert.doesNotMatch(clearSeedScript, /DELETE\s+FROM\s+hospitals/i)
  assert.doesNotMatch(clearSeedScript, /DELETE\s+FROM\s+animal_types/i)
  assert.doesNotMatch(clearSeedScript, /DELETE\s+FROM\s+hospital_animal_types/i)
  assert.doesNotMatch(clearSeedScript, /DROP\s+TYPE/i)
  assertNoUnqualifiedDelete(clearSeedScript)
  assert.match(clearSeedScript, /BEGIN/)
  assert.match(clearSeedScript, /COMMIT/)
  assert.match(clearSeedScript, /ROLLBACK/)
  assert.deepEqual(SEED_EMAILS, [
    'alice@example.com',
    'bob@example.com',
    'carol@example.com',
    'david@example.com',
    'emma@example.com',
  ])
  assert.deepEqual(SEED_MICROCHIP_NUMBERS, [
    '900138000000001',
    '900138000000002',
    '900138000000003',
    '900138000000004',
    '900138000000005',
  ])
})

test('clearSeedData：應以 transaction 依子表到父表順序清除 seed 資料', async () => {
  const calls = []
  const pool = {
    query: async (text, values) => {
      calls.push({ text, values })

      return { rowCount: 1 }
    },
    end: async () => {
      calls.push({ text: 'END' })
    },
  }

  const stats = await clearSeedData({
    pool,
    logger: { info: () => {} },
  })

  assert.deepEqual(stats, {
    calendar_events: 1,
    medical_records: 1,
    growth_records: 1,
    pets: 1,
    users: 1,
  })
  assert.deepEqual(
    calls.map((call) => call.text),
    [
      'BEGIN',
      DELETE_SEED_CALENDAR_EVENTS_SQL,
      DELETE_SEED_MEDICAL_RECORDS_SQL,
      DELETE_SEED_GROWTH_RECORDS_SQL,
      DELETE_SEED_PETS_SQL,
      DELETE_SEED_USERS_SQL,
      'COMMIT',
      'END',
    ],
  )
  assert.deepEqual(calls[4].values, [SEED_MICROCHIP_NUMBERS])
  assert.deepEqual(calls[5].values, [SEED_EMAILS])
})

test('clearSeedData：失敗時應 rollback 並關閉連線', async () => {
  const calls = []
  const pool = {
    query: async (text) => {
      calls.push(text)

      if (text === DELETE_SEED_MEDICAL_RECORDS_SQL) {
        throw new Error('database failed')
      }

      return { rowCount: 1 }
    },
    end: async () => {
      calls.push('END')
    },
  }

  await assert.rejects(
    () => clearSeedData({ pool, logger: { info: () => {} } }),
    /database failed/,
  )

  assert.deepEqual(calls, [
    'BEGIN',
    DELETE_SEED_CALENDAR_EVENTS_SQL,
    DELETE_SEED_MEDICAL_RECORDS_SQL,
    'ROLLBACK',
    'END',
  ])
})

test('fetchMoaHospitalRows：應以 UnitId 單次抓取完整資料集', async () => {
  const seenRequests = []
  const axiosClient = makeAxiosClient(makeRows(2), seenRequests)

  const rows = await fetchMoaHospitalRows({ axiosClient })

  assert.equal(rows.length, 2)
  assert.equal(seenRequests.length, 1)
  assert.equal(seenRequests[0].url, MOA_HOSPITALS_URL)
  assert.deepEqual(seenRequests[0].options.params, { UnitId: '078' })
  assert.equal(seenRequests[0].options.timeout, MOA_REQUEST_TIMEOUT_MS)
  assert.ok(MOA_HOSPITALS_DETAIL_URL.includes('open_detail.aspx?id=078'))
})

test('fetchMoaHospitalRows：MOA 回應不是 array 時應丟出錯誤', async () => {
  const axiosClient = makeAxiosClient({ message: 'not an array' })

  await assert.rejects(
    () => fetchMoaHospitalRows({ axiosClient }),
    /MOA response must be an array/,
  )
})

test('normalizeHospitalRow：應轉換並清理農業部中文欄位', () => {
  const result = normalizeHospitalRow({
    縣市: '宜蘭縣',
    字號: '九三府農畜字第21935號',
    狀態: '開業',
    機構名稱: ' 德生動物醫院 ',
    機構電話: '(039)312162',
    機構地址: '宜蘭縣宜蘭市大東里新民路六十八號',
  })

  assert.deepEqual(result, {
    license_number: '九三府農畜字第21935號',
    name: '德生動物醫院',
    city: '宜蘭縣',
    district: '宜蘭市',
    address: '宜蘭縣宜蘭市大東里新民路六十八號',
    phone: '(039)312162',
    latitude: null,
    longitude: null,
    license_status: '開業',
    is_24h: null,
    emergency_available: null,
  })
})

test('normalizeHospitalRow：應支援官方 sample shape 並忽略未入庫來源欄位', () => {
  const result = normalizeHospitalRow(makeOfficialHospitalRow())

  assert.deepEqual(result, {
    license_number: '九三府農畜字第40682號',
    name: '季廷動物醫院',
    city: '宜蘭縣',
    district: '羅東鎮',
    address: '宜蘭縣羅東鎮中山路2段415號',
    phone: '(039)533111',
    latitude: null,
    longitude: null,
    license_status: '開業',
    is_24h: null,
    emergency_available: null,
  })
  assert.deepEqual(Object.keys(result).sort(), [
    'address',
    'city',
    'district',
    'emergency_available',
    'is_24h',
    'latitude',
    'license_number',
    'license_status',
    'longitude',
    'name',
    'phone',
  ])
  assert.equal('license_type' in result, false)
  assert.equal('responsible_vet' in result, false)
  assert.equal('issued_date' in result, false)
  assert.equal('執照類別' in result, false)
  assert.equal('負責獸醫' in result, false)
  assert.equal('發照日期' in result, false)
})

test('normalizeHospitalRow：空白選填欄位應轉為 null，無法解析 district 時為 null', () => {
  const result = normalizeHospitalRow({
    縣市: '測試縣',
    字號: '測試字號',
    狀態: '開業',
    機構名稱: '測試動物醫院',
    機構電話: '   ',
    機構地址: '無行政區資訊',
  })

  assert.equal(result.phone, null)
  assert.equal(result.district, null)
})

test('importHospitals：應只寫入開業狀態並略過補發', async () => {
  const sourceRows = [
    ...makeRows(1, '開業'),
    ...makeRows(1, '補發'),
  ]
  const queries = []
  const pool = {
    query: async (text, values) => {
      queries.push({ text, values })
    },
  }

  const stats = await importHospitals({
    pool,
    axiosClient: makeAxiosClient(sourceRows),
    logger: { info: () => {} },
  })

  assert.equal(stats.fetched, 2)
  assert.equal(stats.skipped, 1)
  assert.equal(stats.written, 1)
  assert.equal(queries.length, 1)
  assert.equal(queries[0].values[8], '開業')
})

test('normalizeHospitalRow：未知座標、24H 與急診欄位應固定為 null', () => {
  const result = normalizeHospitalRow(makeRows(1)[0])

  assert.equal(result.latitude, null)
  assert.equal(result.longitude, null)
  assert.equal(result.is_24h, null)
  assert.equal(result.emergency_available, null)
})

test('import_hospitals：不應新增 geocoding 設定或推測字串', () => {
  const script = readProjectFile('database/scripts/import_hospitals.js')

  assert.doesNotMatch(script, /geocod/i)
  assert.doesNotMatch(script, /GOOGLE|MAPBOX|HERE/)
})

test('import_hospitals：不應保留 MOA 分頁參數或 pagination helper', () => {
  const script = readProjectFile('database/scripts/import_hospitals.js')

  assert.doesNotMatch(script, /\$top/)
  assert.doesNotMatch(script, /\$skip/)
  assert.doesNotMatch(script, /DEFAULT_PAGE_SIZE/)
  assert.doesNotMatch(script, /fetchMoaHospitalPage/)
  assert.doesNotMatch(script, /fetchAllMoaHospitalRows/)
  assert.doesNotMatch(script, /pagination|paginate/i)
})

test('upsert SQL：應以 license_number 做 ON CONFLICT 去重更新', () => {
  const hospital = normalizeHospitalRow(makeRows(1)[0])

  assert.match(UPSERT_HOSPITAL_SQL, /ON CONFLICT \(license_number\) DO UPDATE/)
  assert.deepEqual(hospitalValues(hospital), [
    hospital.license_number,
    hospital.name,
    hospital.city,
    hospital.district,
    hospital.address,
    hospital.phone,
    hospital.latitude,
    hospital.longitude,
    hospital.license_status,
    hospital.is_24h,
    hospital.emergency_available,
  ])
})

test('upsert SQL：重複匯入時應保留既有座標', () => {
  assert.doesNotMatch(UPSERT_HOSPITAL_SQL, /latitude = EXCLUDED\.latitude/)
  assert.doesNotMatch(UPSERT_HOSPITAL_SQL, /longitude = EXCLUDED\.longitude/)
  assert.match(UPSERT_HOSPITAL_SQL, /updated_at = CURRENT_TIMESTAMP/)
})

test('importHospitals：成功時應輸出統計並回傳 fetched/skipped/written', async () => {
  const logs = []
  const pool = {
    query: async () => {},
  }

  const stats = await importHospitals({
    pool,
    axiosClient: makeAxiosClient(makeRows(2)),
    logger: { info: (message) => logs.push(message) },
  })

  assert.deepEqual(stats, {
    fetched: 2,
    skipped: 0,
    written: 2,
  })
  assert.match(logs[0], /fetched=2, skipped=0, written=2/)
})
