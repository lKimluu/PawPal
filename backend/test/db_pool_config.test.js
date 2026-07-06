import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  createPoolConfigFromEnv,
  createPoolFromEnv,
} from '../src/config/create_pool.js'
import { createPoolFromEnv as createClearSeedPoolFromEnv } from '../scripts/clear-seed.js'
import { createPoolFromEnv as createImportHospitalsPoolFromEnv } from '../database/scripts/import_hospitals.js'
import { createPoolFromEnv as createGeocodeHospitalsPoolFromEnv } from '../database/scripts/geocode_hospitals.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

const dbEnv = {
  DB_USER: 'postgres',
  DB_PASSWORD: 'secret',
  DB_HOST: 'db.example.supabase.co',
  DB_PORT: '5432',
  DB_NAME: 'postgres',
}

test('createPoolConfigFromEnv：應以 DB env 建立 Supabase PostgreSQL pool config', () => {
  assert.deepEqual(createPoolConfigFromEnv(dbEnv), {
    user: 'postgres',
    password: 'secret',
    host: 'db.example.supabase.co',
    port: '5432',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  })
})

test('createPoolFromEnv：應建立含相同 DB env 與 SSL 設定的 pg Pool', async () => {
  const pool = createPoolFromEnv(dbEnv)

  try {
    assert.equal(pool.options.user, 'postgres')
    assert.equal(pool.options.password, 'secret')
    assert.equal(pool.options.host, 'db.example.supabase.co')
    assert.equal(pool.options.port, '5432')
    assert.equal(pool.options.database, 'postgres')
    assert.deepEqual(pool.options.ssl, { rejectUnauthorized: false })
  } finally {
    await pool.end()
  }
})

test('db config：runtime pool 應透過共用 helper 建立且不直接 new Pool', () => {
  const dbConfig = readProjectFile('src/config/db.js')

  assert.match(dbConfig, /createPoolFromEnv/)
  assert.doesNotMatch(dbConfig, /new Pool/)
  assert.match(dbConfig, /export const pool = createPoolFromEnv\(\)/)
})

test('database scripts：應保留 createPoolFromEnv export 並共用 helper', () => {
  assert.equal(createClearSeedPoolFromEnv, createPoolFromEnv)
  assert.equal(createImportHospitalsPoolFromEnv, createPoolFromEnv)
  assert.equal(createGeocodeHospitalsPoolFromEnv, createPoolFromEnv)
})

test('database scripts：不應保留重複 PostgreSQL Pool options', () => {
  const scriptPaths = [
    'scripts/setup-db.js',
    'scripts/clear-seed.js',
    'database/scripts/import_hospitals.js',
    'database/scripts/geocode_hospitals.js',
  ]

  for (const scriptPath of scriptPaths) {
    const script = readProjectFile(scriptPath)

    assert.match(script, /createPoolFromEnv/)
    assert.doesNotMatch(script, /new Pool/)
    assert.doesNotMatch(script, /rejectUnauthorized: false/)
  }
})
