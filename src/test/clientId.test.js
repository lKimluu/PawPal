import assert from 'node:assert/strict'
import { test } from 'node:test'
import axios from 'axios'

import { login } from '../api/auth.js'
import {
  CLIENT_ID_HEADER,
  CLIENT_ID_STORAGE_KEY,
  getClientIdHeaders,
  getOrCreateClientId,
} from '../api/clientId.js'
import { fetchMapHospitals } from '../api/hospitals.js'

const CLIENT_A = '550e8400-e29b-41d4-a716-446655440000'
const CLIENT_B = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'

function createStorage(initialValue) {
  const values = new Map()

  if (initialValue !== undefined) {
    values.set(CLIENT_ID_STORAGE_KEY, initialValue)
  }

  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

function replaceGlobal(name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
  Object.defineProperty(globalThis, name, { configurable: true, value })

  return () => {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      delete globalThis[name]
    }
  }
}

test('首次 eligible request 產生並持久化 UUID，後續 request 重用', () => {
  const storage = createStorage()
  let generatedCount = 0
  const options = {
    storage,
    cryptoProvider: {
      randomUUID() {
        generatedCount += 1
        return CLIENT_A
      },
    },
  }

  assert.equal(getOrCreateClientId(options), CLIENT_A)
  assert.equal(storage.getItem(CLIENT_ID_STORAGE_KEY), CLIENT_A)
  assert.equal(getOrCreateClientId(options), CLIENT_A)
  assert.equal(generatedCount, 1)
})

test('無效 stored client ID 會由新的 UUID v4 取代', () => {
  const storage = createStorage('invalid-client-id')

  assert.deepEqual(
    getClientIdHeaders({ storage, cryptoProvider: { randomUUID: () => CLIENT_B } }),
    { [CLIENT_ID_HEADER]: CLIENT_B },
  )
  assert.equal(storage.getItem(CLIENT_ID_STORAGE_KEY), CLIENT_B)
})

test('crypto 或 localStorage 無法使用時省略 header', () => {
  assert.deepEqual(
    getClientIdHeaders({ storage: createStorage(), cryptoProvider: {} }),
    {},
  )
  assert.deepEqual(
    getClientIdHeaders({
      storage: {
        getItem() {
          throw new Error('storage unavailable')
        },
      },
      cryptoProvider: { randomUUID: () => CLIENT_A },
    }),
    {},
  )
})

test('auth 與 map requests 傳送持久化 client ID header', async () => {
  const restoreStorage = replaceGlobal('localStorage', createStorage(CLIENT_A))
  const originalPost = axios.post
  const originalGet = axios.get
  const calls = []

  axios.post = async (url, payload, config) => {
    calls.push({ config, url })
    return { data: { message: 'ok' } }
  }
  axios.get = async (url, config) => {
    calls.push({ config, url })
    return { data: { hospitals: [] } }
  }

  try {
    await login({ email: 'user@example.com', password: 'password' })
    await fetchMapHospitals({ north: 26, south: 24, east: 122, west: 120 })

    assert.equal(calls.length, 2)
    assert.equal(calls[0].config.headers[CLIENT_ID_HEADER], CLIENT_A)
    assert.equal(calls[1].config.headers[CLIENT_ID_HEADER], CLIENT_A)
  } finally {
    axios.post = originalPost
    axios.get = originalGet
    restoreStorage()
  }
})

test('client ID storage failure 不阻擋 auth 與 map requests', async () => {
  const unavailableStorage = {
    getItem() {
      throw new Error('storage unavailable')
    },
  }
  const restoreStorage = replaceGlobal('localStorage', unavailableStorage)
  const originalPost = axios.post
  const originalGet = axios.get
  const calls = []

  axios.post = async (url, payload, config) => {
    calls.push(config)
    return { data: { message: 'ok' } }
  }
  axios.get = async (url, config) => {
    calls.push(config)
    return { data: { hospitals: [] } }
  }

  try {
    assert.equal((await login({ email: 'user@example.com', password: 'password' })).success, true)
    assert.equal((await fetchMapHospitals({})).success, true)
    assert.deepEqual(calls[0].headers, { 'Content-Type': 'application/json' })
    assert.deepEqual(calls[1].headers, {})
  } finally {
    axios.post = originalPost
    axios.get = originalGet
    restoreStorage()
  }
})
