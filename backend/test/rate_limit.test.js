import assert from 'node:assert/strict'
import { test } from 'node:test'

function createRequest() {
  return {
    app: {
      get() {
        return false
      },
    },
    headers: {},
    ip: '127.0.0.1',
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

async function runMiddleware(middleware) {
  const req = createRequest()
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

test('API 請求在限制內應放行，超過限制時回傳 429', async () => {
  process.env.RATE_LIMIT_WINDOW_MS = '60000'
  process.env.RATE_LIMIT_MAX = '1'

  const { apiRateLimiter } = await import(`../src/config/rate_limit.js?rate-limit-test=${Date.now()}`)

  try {
    const firstResult = await runMiddleware(apiRateLimiter)
    assert.equal(firstResult.nextCalled, true)
    assert.equal(firstResult.res.statusCode, 200)

    const secondResult = await runMiddleware(apiRateLimiter)
    assert.equal(secondResult.nextCalled, false)
    assert.equal(secondResult.res.statusCode, 429)
    assert.deepEqual(secondResult.res.body, {
      message: '請求過於頻繁，請稍後再試',
    })
  } finally {
    delete process.env.RATE_LIMIT_WINDOW_MS
    delete process.env.RATE_LIMIT_MAX
  }
})
