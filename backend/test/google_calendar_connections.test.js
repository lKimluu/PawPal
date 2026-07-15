import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createConnectGoogleCalendar,
  createDisconnectGoogleCalendar,
  createGetGoogleCalendarStatus,
} from '../src/controllers/google_calendar_connections.controller.js'
import { connectGoogleCalendarSchema } from '../src/schemas/google_calendar_connections.schema.js'

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const FULL_SCOPE = `openid email profile ${CALENDAR_EVENTS_SCOPE}`

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

function notImplemented(name) {
  return async () => {
    throw new Error(`${name} should not be called`)
  }
}

function createConnectController(overrides = {}) {
  return createConnectGoogleCalendar({
    exchangeCodeForTokens: notImplemented('exchangeCodeForTokens'),
    revokeGoogleToken: notImplemented('revokeGoogleToken'),
    getConnectionByUserId: notImplemented('getConnectionByUserId'),
    upsertConnection: notImplemented('upsertConnection'),
    updateAccessToken: notImplemented('updateAccessToken'),
    ...overrides,
  })
}

test('connect schema：缺少 code 應回必填錯誤訊息', () => {
  const result = connectGoogleCalendarSchema.safeParse({})

  assert.equal(result.success, false)
  assert.equal(result.error.issues[0].message, '缺少 Google 授權碼 (Code)')
})

test('connect schema：code 為空字串應驗證失敗', () => {
  const result = connectGoogleCalendarSchema.safeParse({ code: '   ' })

  assert.equal(result.success, false)
})

test('connect schema：code 正常應通過並去除前後空白', () => {
  const result = connectGoogleCalendarSchema.safeParse({ code: '  4/0AbCdEf  ' })

  assert.equal(result.success, true)
  assert.equal(result.data.code, '4/0AbCdEf')
})

test('connect：兌換成功且有 refresh token 應存 DB 並回 200', async () => {
  const upsertCalls = []
  const connectGoogleCalendar = createConnectController({
    exchangeCodeForTokens: async () => ({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expiry_date: 1767072000000,
      scope: FULL_SCOPE,
    }),
    upsertConnection: async (payload) => {
      upsertCalls.push(payload)
      return { id: 1, user_id: 42 }
    },
  })
  const res = createResponse()

  await connectGoogleCalendar({ userId: 42, body: { code: 'auth-code' } }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.connected, true)
  assert.equal(upsertCalls.length, 1)
  assert.equal(upsertCalls[0].userId, 42)
  assert.equal(upsertCalls[0].refreshToken, 'refresh-token')
  assert.ok(upsertCalls[0].expiresAt instanceof Date)
})

test('connect：scope 未含行事曆權限應回 400 且不存 DB', async () => {
  const upsertCalls = []
  const connectGoogleCalendar = createConnectController({
    exchangeCodeForTokens: async () => ({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expiry_date: null,
      scope: 'openid email profile',
    }),
    upsertConnection: async (payload) => {
      upsertCalls.push(payload)
    },
  })
  const res = createResponse()

  await connectGoogleCalendar({ userId: 42, body: { code: 'auth-code' } }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, '請在 Google 授權畫面勾選行事曆權限後重試')
  assert.equal(upsertCalls.length, 0)
})

test('connect：scope 為相似名稱（readonly）不應誤判通過', async () => {
  const connectGoogleCalendar = createConnectController({
    exchangeCodeForTokens: async () => ({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expiry_date: null,
      scope: 'openid https://www.googleapis.com/auth/calendar.events.readonly',
    }),
  })
  const res = createResponse()

  await connectGoogleCalendar({ userId: 42, body: { code: 'auth-code' } }, res)

  assert.equal(res.statusCode, 400)
})

test('connect：無 refresh token 但有舊連接應沿用並回 200', async () => {
  const updateCalls = []
  const connectGoogleCalendar = createConnectController({
    exchangeCodeForTokens: async () => ({
      access_token: 'new-access-token',
      refresh_token: null,
      expiry_date: 1767072000000,
      scope: FULL_SCOPE,
    }),
    getConnectionByUserId: async () => ({ id: 1, user_id: 42, google_refresh_token: 'old-token' }),
    updateAccessToken: async (payload) => {
      updateCalls.push(payload)
      return { id: 1, user_id: 42 }
    },
  })
  const res = createResponse()

  await connectGoogleCalendar({ userId: 42, body: { code: 'auth-code' } }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.connected, true)
  assert.equal(updateCalls.length, 1)
  assert.equal(updateCalls[0].accessToken, 'new-access-token')
})

test('connect：無 refresh token 且無舊連接應撤銷授權並回 400', async () => {
  const revokedTokens = []
  const connectGoogleCalendar = createConnectController({
    exchangeCodeForTokens: async () => ({
      access_token: 'orphan-access-token',
      refresh_token: null,
      expiry_date: null,
      scope: FULL_SCOPE,
    }),
    getConnectionByUserId: async () => null,
    revokeGoogleToken: async (token) => {
      revokedTokens.push(token)
    },
  })
  const res = createResponse()

  await connectGoogleCalendar({ userId: 42, body: { code: 'auth-code' } }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, '連接發生問題，請再點一次連接')
  assert.deepEqual(revokedTokens, ['orphan-access-token'])
})

test('connect：授權碼兌換失敗應回 401', async () => {
  const connectGoogleCalendar = createConnectController({
    exchangeCodeForTokens: async () => {
      throw new Error('invalid_grant')
    },
  })
  const res = createResponse()

  await connectGoogleCalendar({ userId: 42, body: { code: 'expired-code' } }, res)

  assert.equal(res.statusCode, 401)
  assert.equal(res.body.message, 'Google 授權已失效，請重新連接')
})

test('connect：未授權（無 userId）應回 401', async () => {
  const connectGoogleCalendar = createConnectController()
  const res = createResponse()

  await connectGoogleCalendar({ body: { code: 'auth-code' } }, res)

  assert.equal(res.statusCode, 401)
})

test('disconnect：有連接應先向 Google 撤銷再刪除 DB', async () => {
  const calls = []
  const disconnectGoogleCalendar = createDisconnectGoogleCalendar({
    getConnectionByUserId: async () => ({
      id: 1,
      user_id: 42,
      google_refresh_token: 'refresh-token',
    }),
    revokeGoogleToken: async (token) => {
      calls.push(['revoke', token])
    },
    deleteConnectionByUserId: async (userId) => {
      calls.push(['delete', userId])
      return { id: 1 }
    },
  })
  const res = createResponse()

  await disconnectGoogleCalendar({ userId: 42 }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.message, '已中斷 Google 行事曆連接')
  assert.deepEqual(calls, [
    ['revoke', 'refresh-token'],
    ['delete', 42],
  ])
})

test('disconnect：撤銷失敗（服務內部已吞錯）仍應刪除 DB 並回成功', async () => {
  const deleteCalls = []
  const disconnectGoogleCalendar = createDisconnectGoogleCalendar({
    getConnectionByUserId: async () => ({
      id: 1,
      user_id: 42,
      google_refresh_token: 'dead-token',
    }),
    // revokeGoogleToken 服務本身會吞掉 Google 端錯誤、正常 resolve
    revokeGoogleToken: async () => {},
    deleteConnectionByUserId: async (userId) => {
      deleteCalls.push(userId)
      return { id: 1 }
    },
  })
  const res = createResponse()

  await disconnectGoogleCalendar({ userId: 42 }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(deleteCalls, [42])
})

test('disconnect：沒有連接也應回成功且不呼叫撤銷', async () => {
  const disconnectGoogleCalendar = createDisconnectGoogleCalendar({
    getConnectionByUserId: async () => null,
    revokeGoogleToken: notImplemented('revokeGoogleToken'),
    deleteConnectionByUserId: notImplemented('deleteConnectionByUserId'),
  })
  const res = createResponse()

  await disconnectGoogleCalendar({ userId: 42 }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.message, '已中斷 Google 行事曆連接')
})

test('status：已連接應回 connected true', async () => {
  const getGoogleCalendarStatus = createGetGoogleCalendarStatus({
    getConnectionByUserId: async () => ({ id: 1, user_id: 42 }),
  })
  const res = createResponse()

  await getGoogleCalendarStatus({ userId: 42 }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { data: { connected: true } })
})

test('status：未連接應回 connected false', async () => {
  const getGoogleCalendarStatus = createGetGoogleCalendarStatus({
    getConnectionByUserId: async () => null,
  })
  const res = createResponse()

  await getGoogleCalendarStatus({ userId: 42 }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { data: { connected: false } })
})
