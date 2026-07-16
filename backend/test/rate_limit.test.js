import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test } from 'node:test'
import express from 'express'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'

import app from '../src/app.js'
import {
  authIpRateLimiter,
  authRateLimiter,
  generalApiRateLimitOptions,
  hospitalMapIpRateLimiter,
  hospitalMapRateLimiter,
} from '../src/config/rate_limit.js'
import authRoutes from '../src/routes/auth.route.js'
import hospitalRoutes from '../src/routes/hospitals.route.js'

function createRequest(overrides = {}) {
  return {
    app: {
      get() {
        return false
      },
    },
    headers: {},
    ip: '127.0.0.1',
    method: 'GET',
    path: '/pets',
    ...overrides,
  }
}

function createResponse() {
  return {
    body: undefined,
    headers: {},
    headersSent: false,
    statusCode: 200,
    writableEnded: false,
    setHeader(name, value) {
      this.headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      this.writableEnded = true
      return this
    },
  }
}

async function runMiddleware(middleware, requestOverrides) {
  const req = createRequest(requestOverrides)
  const res = createResponse()
  let nextCalled = false
  let nextError

  await middleware(req, res, (error) => {
    if (error) {
      nextError = error
      return
    }

    nextCalled = true
  })

  if (nextError) {
    throw nextError
  }

  return { nextCalled, req, res }
}

async function listen(application) {
  const server = application.listen(0, '127.0.0.1')
  await once(server, 'listening')

  return {
    server,
    url: `http://127.0.0.1:${server.address().port}`,
  }
}

const rateLimitEnvNames = [
  'GENERAL_API_RATE_LIMIT_WINDOW_MS',
  'GENERAL_API_RATE_LIMIT_MAX',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',
  'HOSPITAL_MAP_RATE_LIMIT_WINDOW_MS',
  'HOSPITAL_MAP_RATE_LIMIT_MAX',
  'HOSPITAL_MAP_IP_RATE_LIMIT_WINDOW_MS',
  'HOSPITAL_MAP_IP_RATE_LIMIT_MAX',
  'AUTH_RATE_LIMIT_WINDOW_MS',
  'AUTH_RATE_LIMIT_MAX',
  'AUTH_IP_RATE_LIMIT_WINDOW_MS',
  'AUTH_IP_RATE_LIMIT_MAX',
]

async function withRateLimitEnv(values, callback) {
  const snapshot = Object.fromEntries(rateLimitEnvNames.map((name) => [name, process.env[name]]))

  try {
    for (const name of rateLimitEnvNames) {
      delete process.env[name]
    }
    Object.assign(process.env, values)

    return await callback()
  } finally {
    for (const [name, value] of Object.entries(snapshot)) {
      if (value === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = value
      }
    }
  }
}

async function importRateLimitConfig() {
  return import(`../src/config/rate_limit.js?rate-limit-test=${Date.now()}-${Math.random()}`)
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

function createProxyTestApp() {
  const application = express()
  application.set('trust proxy', 1)
  application.use(
    rateLimit({
      windowMs: 60_000,
      limit: 1,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => res.status(429).json({ message: '請求過於頻繁，請稍後再試' }),
    }),
  )
  application.get('/', (req, res) => res.json({ ip: req.ip }))

  return application
}

function createTieredRoutingTestApp({
  generalApiRateLimiter,
  hospitalMapIpRateLimiter,
  hospitalMapRateLimiter,
  authIpRateLimiter,
  authRateLimiter,
}) {
  const application = express()
  const sendOk = (req, res) => res.json({ ok: true })

  application.use('/api/v1', generalApiRateLimiter)
  application.get(
    '/api/v1/hospitals/map',
    hospitalMapIpRateLimiter,
    hospitalMapRateLimiter,
    sendOk,
  )

  for (const path of ['/register', '/login', '/google-login', '/line-login']) {
    application.post(`/api/v1/auth${path}`, authIpRateLimiter, authRateLimiter, sendOk)
  }

  application.get('/api/v1/pets', sendOk)

  return application
}

test('API rate limiting identifies clients behind one trusted proxy', async () => {
  assert.equal(app.get('trust proxy'), 1)

  const validationErrors = []
  const originalConsoleError = console.error
  console.error = (...args) => {
    if (args.some((value) => String(value).includes('ERR_ERL_UNEXPECTED_X_FORWARDED_FOR'))) {
      validationErrors.push(args)
    }
  }

  const { server, url } = await listen(app)

  try {
    await fetch(`${url}/api/v1/not-found`, {
      headers: { 'X-Forwarded-For': '203.0.113.10' },
    })
    assert.deepEqual(validationErrors, [])
  } finally {
    console.error = originalConsoleError
    await close(server)
  }
})

test('Rate limit counters remain isolated by resolved client IP', async () => {
  const { server, url } = await listen(createProxyTestApp())

  try {
    const firstClient = await fetch(url, {
      headers: { 'X-Forwarded-For': '203.0.113.10' },
    })
    const secondClient = await fetch(url, {
      headers: { 'X-Forwarded-For': '198.51.100.20' },
    })
    const repeatedClient = await fetch(url, {
      headers: { 'X-Forwarded-For': '203.0.113.10' },
    })

    assert.equal(firstClient.status, 200)
    assert.deepEqual(await firstClient.json(), { ip: '203.0.113.10' })
    assert.equal(secondClient.status, 200)
    assert.deepEqual(await secondClient.json(), { ip: '198.51.100.20' })
    assert.equal(repeatedClient.status, 429)
    assert.deepEqual(await repeatedClient.json(), {
      message: '請求過於頻繁，請稍後再試',
    })
  } finally {
    await close(server)
  }
})

test('直接連線未提供 X-Forwarded-For 時仍使用 socket remote address', async () => {
  const { server, url } = await listen(createProxyTestApp())

  try {
    const response = await fetch(url)

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ip: '127.0.0.1' })
  } finally {
    await close(server)
  }
})

test('各 limiter 應使用文件化預設值', async () => {
  await withRateLimitEnv({}, async () => {
    const {
      generalApiRateLimitOptions,
      hospitalMapRateLimitOptions,
      hospitalMapIpRateLimitOptions,
      authRateLimitOptions,
      authIpRateLimitOptions,
    } = await importRateLimitConfig()

    assert.equal(generalApiRateLimitOptions.windowMs, 900_000)
    assert.equal(generalApiRateLimitOptions.limit, 600)
    assert.equal(hospitalMapRateLimitOptions.windowMs, 60_000)
    assert.equal(hospitalMapRateLimitOptions.limit, 60)
    assert.equal(hospitalMapIpRateLimitOptions.windowMs, 60_000)
    assert.equal(hospitalMapIpRateLimitOptions.limit, 600)
    assert.equal(authRateLimitOptions.windowMs, 900_000)
    assert.equal(authRateLimitOptions.limit, 10)
    assert.equal(authIpRateLimitOptions.windowMs, 900_000)
    assert.equal(authIpRateLimitOptions.limit, 100)
  })
})

test('一般 limiter 新環境變數優先，無效時回退舊變數或預設值', async () => {
  await withRateLimitEnv(
    {
      GENERAL_API_RATE_LIMIT_WINDOW_MS: '120000',
      GENERAL_API_RATE_LIMIT_MAX: '700',
      RATE_LIMIT_WINDOW_MS: '300000',
      RATE_LIMIT_MAX: '800',
    },
    async () => {
      const { generalApiRateLimitOptions } = await importRateLimitConfig()
      assert.equal(generalApiRateLimitOptions.windowMs, 120_000)
      assert.equal(generalApiRateLimitOptions.limit, 700)
    },
  )

  await withRateLimitEnv(
    {
      GENERAL_API_RATE_LIMIT_WINDOW_MS: 'invalid',
      GENERAL_API_RATE_LIMIT_MAX: '700requests',
      RATE_LIMIT_WINDOW_MS: '300000',
      RATE_LIMIT_MAX: '800',
    },
    async () => {
      const { generalApiRateLimitOptions } = await importRateLimitConfig()
      assert.equal(generalApiRateLimitOptions.windowMs, 300_000)
      assert.equal(generalApiRateLimitOptions.limit, 800)
    },
  )
})

test('所有 limiter 超限時應回傳相同繁體中文 429', async () => {
  await withRateLimitEnv(
    {
      GENERAL_API_RATE_LIMIT_MAX: '1',
      HOSPITAL_MAP_RATE_LIMIT_MAX: '1',
      HOSPITAL_MAP_IP_RATE_LIMIT_MAX: '1',
      AUTH_RATE_LIMIT_MAX: '1',
      AUTH_IP_RATE_LIMIT_MAX: '1',
    },
    async () => {
      const {
        generalApiRateLimiter,
        hospitalMapRateLimiter,
        hospitalMapIpRateLimiter,
        authRateLimiter,
        authIpRateLimiter,
      } = await importRateLimitConfig()

      for (const limiter of [
        generalApiRateLimiter,
        hospitalMapRateLimiter,
        hospitalMapIpRateLimiter,
        authRateLimiter,
        authIpRateLimiter,
      ]) {
        const firstResult = await runMiddleware(limiter)
        const secondResult = await runMiddleware(limiter)

        assert.equal(firstResult.nextCalled, true)
        assert.equal(secondResult.nextCalled, false)
        assert.equal(secondResult.res.statusCode, 429)
        assert.deepEqual(secondResult.res.body, {
          message: '請求過於頻繁，請稍後再試',
        })
      }
    },
  )
})

test('一般 limiter 只跳過具有專屬政策的 method 與 path', () => {
  const { skip } = generalApiRateLimitOptions

  assert.equal(skip({ method: 'GET', path: '/hospitals/map' }), true)
  assert.equal(skip({ method: 'GET', path: '/hospitals/map/' }), true)
  assert.equal(skip({ method: 'GET', path: '/HOSPITALS/MAP' }), true)
  assert.equal(skip({ method: 'POST', path: '/hospitals/map' }), false)
  assert.equal(skip({ method: 'POST', path: '/HOSPITALS/MAP/' }), false)
  assert.equal(skip({ method: 'GET', path: '/hospitals/nearby' }), false)

  for (const path of [
    '/auth/register',
    '/auth/login',
    '/auth/google-login',
    '/auth/line-login',
  ]) {
    assert.equal(skip({ method: 'POST', path }), true)
    assert.equal(skip({ method: 'POST', path: `${path}/` }), true)
    assert.equal(skip({ method: 'POST', path: path.toUpperCase() }), true)
    assert.equal(skip({ method: 'GET', path }), false)
  }
})

test('GET /hospitals/map 應在驗證與 controller 前套用 map limiter', () => {
  const mapRoute = hospitalRoutes.stack.find((layer) => layer.route?.path === '/map')
  const middleware = mapRoute.route.stack.map((layer) => layer.handle)

  assert.equal(middleware.length, 4)
  assert.equal(middleware[0], hospitalMapIpRateLimiter)
  assert.equal(middleware[1], hospitalMapRateLimiter)
})

test('四個敏感 auth routes 應在驗證與 controller 前套用 auth limiter', () => {
  const expectedPaths = ['/register', '/login', '/google-login', '/line-login']
  const routes = authRoutes.stack.filter((layer) => layer.route)

  assert.deepEqual(
    routes.map((layer) => layer.route.path),
    expectedPaths,
  )

  for (const route of routes) {
    const middleware = route.route.stack.map((layer) => layer.handle)
    assert.equal(middleware.length, 4)
    assert.equal(middleware[0], authIpRateLimiter)
    assert.equal(middleware[1], authRateLimiter)
  }
})

test('map 與 auth requests 不消耗一般 API 額度', async () => {
  await withRateLimitEnv(
    {
      GENERAL_API_RATE_LIMIT_MAX: '1',
      HOSPITAL_MAP_RATE_LIMIT_MAX: '1',
      AUTH_RATE_LIMIT_MAX: '1',
    },
    async () => {
      const { generalApiRateLimiter, hospitalMapRateLimiter, authRateLimiter } =
        await importRateLimitConfig()

      for (const request of [
        { method: 'GET', path: '/hospitals/map' },
        { method: 'POST', path: '/auth/login' },
      ]) {
        assert.equal((await runMiddleware(generalApiRateLimiter, request)).nextCalled, true)
        assert.equal((await runMiddleware(generalApiRateLimiter, request)).nextCalled, true)
      }

      assert.equal((await runMiddleware(generalApiRateLimiter)).nextCalled, true)
      assert.equal((await runMiddleware(generalApiRateLimiter)).res.statusCode, 429)

      assert.equal((await runMiddleware(hospitalMapRateLimiter)).nextCalled, true)
      assert.equal((await runMiddleware(hospitalMapRateLimiter)).res.statusCode, 429)

      assert.equal((await runMiddleware(authRateLimiter)).nextCalled, true)
      assert.equal((await runMiddleware(authRateLimiter)).res.statusCode, 429)
    },
  )
})

test('hospital map 的大小寫與尾斜線變體只消耗 map 額度', async () => {
  await withRateLimitEnv(
    {
      GENERAL_API_RATE_LIMIT_MAX: '1',
      HOSPITAL_MAP_RATE_LIMIT_MAX: '10',
      AUTH_RATE_LIMIT_MAX: '10',
    },
    async () => {
      const limiters = await importRateLimitConfig()
      const { server, url } = await listen(createTieredRoutingTestApp(limiters))

      try {
        for (const path of ['/api/v1/hospitals/map/', '/api/v1/HOSPITALS/MAP']) {
          const response = await fetch(`${url}${path}`)
          assert.equal(response.status, 200, `${path} 應由 Express map route 接受`)
        }

        assert.equal((await fetch(`${url}/api/v1/pets`)).status, 200)
        assert.equal((await fetch(`${url}/api/v1/pets`)).status, 429)
      } finally {
        await close(server)
      }
    },
  )
})

test('四個敏感 auth routes 的大小寫與尾斜線變體只消耗 auth 額度', async () => {
  await withRateLimitEnv(
    {
      GENERAL_API_RATE_LIMIT_MAX: '1',
      HOSPITAL_MAP_RATE_LIMIT_MAX: '10',
      AUTH_RATE_LIMIT_MAX: '20',
    },
    async () => {
      const limiters = await importRateLimitConfig()
      const { server, url } = await listen(createTieredRoutingTestApp(limiters))

      try {
        for (const path of ['/register', '/login', '/google-login', '/line-login']) {
          for (const variant of [`/api/v1/auth${path}/`, `/api/v1/AUTH${path.toUpperCase()}`]) {
            const response = await fetch(`${url}${variant}`, { method: 'POST' })
            assert.equal(response.status, 200, `${variant} 應由 Express auth route 接受`)
          }
        }

        assert.equal((await fetch(`${url}/api/v1/pets`)).status, 200)
        assert.equal((await fetch(`${url}/api/v1/pets`)).status, 429)
      } finally {
        await close(server)
      }
    },
  )
})

test('client-aware keys 應隔離同 IP 不同 UUID 並正規化 IPv4/IPv6', async () => {
  await withRateLimitEnv({}, async () => {
    const {
      authRateLimitOptions,
      authIpRateLimitOptions,
      hospitalMapRateLimitOptions,
      hospitalMapIpRateLimitOptions,
    } = await importRateLimitConfig()
    const clientA = '550e8400-e29b-41d4-a716-446655440000'
    const clientB = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'

    for (const options of [authRateLimitOptions, hospitalMapRateLimitOptions]) {
      const firstKey = options.keyGenerator({
        ip: '203.0.113.10',
        headers: { 'x-pawpal-client-id': clientA },
      })
      const repeatedKey = options.keyGenerator({
        ip: '203.0.113.10',
        headers: { 'x-pawpal-client-id': clientA.toUpperCase() },
      })
      const secondClientKey = options.keyGenerator({
        ip: '203.0.113.10',
        headers: { 'x-pawpal-client-id': clientB },
      })

      assert.equal(firstKey, repeatedKey)
      assert.notEqual(firstKey, secondClientKey)
    }

    for (const [namespace, options] of [
      ['auth-ceiling', authIpRateLimitOptions],
      ['hospital-map-ceiling', hospitalMapIpRateLimitOptions],
    ]) {
      for (const ip of ['203.0.113.10', '2001:db8:abcd:1200::1']) {
        assert.equal(options.keyGenerator({ ip }), `${namespace}:ip:${ipKeyGenerator(ip)}`)
      }
    }
  })
})

test('client-aware limiter 應隔離合法 ID 並將缺少、多值或無效 ID 合併至 IP fallback', async () => {
  await withRateLimitEnv(
    {
      AUTH_RATE_LIMIT_MAX: '1',
      HOSPITAL_MAP_RATE_LIMIT_MAX: '1',
    },
    async () => {
      const { authRateLimiter, hospitalMapRateLimiter } = await importRateLimitConfig()
      const clientA = '550e8400-e29b-41d4-a716-446655440000'
      const clientB = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'

      for (const limiter of [authRateLimiter, hospitalMapRateLimiter]) {
        const clientARequest = { headers: { 'x-pawpal-client-id': clientA } }
        const clientBRequest = { headers: { 'x-pawpal-client-id': clientB } }

        assert.equal((await runMiddleware(limiter, clientARequest)).nextCalled, true)
        assert.equal((await runMiddleware(limiter, clientARequest)).res.statusCode, 429)
        assert.equal((await runMiddleware(limiter, clientBRequest)).nextCalled, true)

        assert.equal((await runMiddleware(limiter)).nextCalled, true)
        assert.equal(
          (
            await runMiddleware(limiter, {
              headers: { 'x-pawpal-client-id': 'not-a-uuid' },
            })
          ).res.statusCode,
          429,
        )
      }
    },
  )

  await withRateLimitEnv({ AUTH_RATE_LIMIT_MAX: '1' }, async () => {
    const { authRateLimiter } = await importRateLimitConfig()

    assert.equal(
      (
        await runMiddleware(authRateLimiter, {
          headers: { 'x-pawpal-client-id': ['550e8400-e29b-41d4-a716-446655440000'] },
        })
      ).nextCalled,
      true,
    )
    assert.equal((await runMiddleware(authRateLimiter)).res.statusCode, 429)
  })
})

test('純 IP ceiling 應提供文件化預設、環境覆寫與共同 429', async () => {
  await withRateLimitEnv(
    {
      AUTH_IP_RATE_LIMIT_WINDOW_MS: '120000',
      AUTH_IP_RATE_LIMIT_MAX: '2',
      HOSPITAL_MAP_IP_RATE_LIMIT_WINDOW_MS: '30000',
      HOSPITAL_MAP_IP_RATE_LIMIT_MAX: '2',
    },
    async () => {
      const {
        authIpRateLimitOptions,
        authIpRateLimiter,
        hospitalMapIpRateLimitOptions,
        hospitalMapIpRateLimiter,
      } = await importRateLimitConfig()

      assert.equal(authIpRateLimitOptions.windowMs, 120_000)
      assert.equal(authIpRateLimitOptions.limit, 2)
      assert.equal(hospitalMapIpRateLimitOptions.windowMs, 30_000)
      assert.equal(hospitalMapIpRateLimitOptions.limit, 2)

      for (const limiter of [authIpRateLimiter, hospitalMapIpRateLimiter]) {
        assert.equal((await runMiddleware(limiter)).nextCalled, true)
        assert.equal((await runMiddleware(limiter)).nextCalled, true)
        const exceeded = await runMiddleware(limiter)
        assert.equal(exceeded.res.statusCode, 429)
        assert.deepEqual(exceeded.res.body, { message: '請求過於頻繁，請稍後再試' })
      }
    },
  )
})

test('輪替 client IDs 仍受 auth 第 101 次與 map 第 601 次純 IP ceiling 限制', async () => {
  await withRateLimitEnv({}, async () => {
    const { authIpRateLimiter, hospitalMapIpRateLimiter } = await importRateLimitConfig()

    for (let requestNumber = 1; requestNumber <= 100; requestNumber += 1) {
      assert.equal((await runMiddleware(authIpRateLimiter)).nextCalled, true)
    }
    assert.equal((await runMiddleware(authIpRateLimiter)).res.statusCode, 429)

    for (let requestNumber = 1; requestNumber <= 600; requestNumber += 1) {
      assert.equal((await runMiddleware(hospitalMapIpRateLimiter)).nextCalled, true)
    }
    assert.equal((await runMiddleware(hospitalMapIpRateLimiter)).res.statusCode, 429)
  })
})
