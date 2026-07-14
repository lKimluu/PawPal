import assert from 'node:assert/strict'
import { test } from 'node:test'

import app from '../src/app.js'
import { authenticateToken } from '../src/middlewares/auth.middleware.js'
import hospitalReviewsRoutes from '../src/routes/hospital_reviews.route.js'

test('hospital review routes expose public listing and authenticated creation', () => {
  const routes = hospitalReviewsRoutes.stack.map((layer) => ({
    path: layer.route?.path,
    methods: Object.keys(layer.route?.methods ?? {}),
    handlers: layer.route?.stack.map((entry) => entry.handle),
  }))

  assert.deepEqual(
    routes.map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/', methods: ['get'] },
      { path: '/', methods: ['post'] },
      { path: '/:reviewId', methods: ['patch'] },
      { path: '/:reviewId', methods: ['delete'] },
    ],
  )

  assert.equal(routes[0].handlers.length, 1)
  assert.equal(routes[1].handlers[0], authenticateToken)
  assert.equal(routes[1].handlers.length, 3)
  assert.equal(routes[2].handlers[0], authenticateToken)
  assert.equal(routes[2].handlers.length, 3)
  assert.equal(routes[3].handlers[0], authenticateToken)
  assert.equal(routes[3].handlers.length, 2)
})

test('hospital review routes are mounted under /api/v1/hospitals/:hospitalId/reviews', () => {
  const stack = app._router?.stack || app.router?.stack || []
  const isMounted = stack.some((layer) => layer.handle === hospitalReviewsRoutes)

  assert.equal(isMounted, true)
})
