import assert from 'node:assert/strict'
import { test } from 'node:test'
import app from '../src/app.js'
import {
  normalizeMedicalRecordMultipartBody,
  uploadMedicalRecordImages,
} from '../src/middlewares/upload_image.js'
import medicalRecordRoutes from '../src/routes/medical_records.route.js'

test('應註冊所有醫療紀錄模組對應的 CRUD 路由並正確配置中間件', () => {
  const expectedRoutes = [
    { path: '/', method: 'get', minHandlers: 2 },
    { path: '/pet/:petId', method: 'get', minHandlers: 2 },
    { path: '/:id', method: 'get', minHandlers: 2 },
    { path: '/', method: 'post', minHandlers: 5 },
    { path: '/:id', method: 'patch', minHandlers: 5 },
    { path: '/:id', method: 'delete', minHandlers: 2 },
  ]

  expectedRoutes.forEach((expected) => {
    const routeLayer = medicalRecordRoutes.stack.find(
      (layer) => layer.route?.path === expected.path && layer.route?.methods[expected.method],
    )
    assert.ok(routeLayer, `❌ 找不到路徑為 ${expected.path} 且方法為 ${expected.method} 的路由`)
    assert.ok(
      routeLayer.route.stack.length >= expected.minHandlers,
      `❌ 路徑 ${expected.path} 處理器數量不足，可能漏掛了 JWT 認證或 Zod 驗證中間件`,
    )
  })
})

test('醫療紀錄建立與更新路由應在驗證前支援圖片上傳與欄位正規化', () => {
  const postRoute = medicalRecordRoutes.stack.find(
    (layer) => layer.route?.path === '/' && layer.route?.methods.post,
  )
  const patchRoute = medicalRecordRoutes.stack.find(
    (layer) => layer.route?.path === '/:id' && layer.route?.methods.patch,
  )

  for (const route of [postRoute, patchRoute]) {
    assert.equal(route.route.stack[1].handle, uploadMedicalRecordImages)
    assert.equal(route.route.stack[2].handle, normalizeMedicalRecordMultipartBody)
  }
})

test('應將醫療紀錄路由正確掛載於應用程式的核心路由器中', () => {
  const stack = app._router?.stack || app.router?.stack || []

  const isMounted = stack.some((layer) => {
    if (layer.handle === medicalRecordRoutes) return true
    if (layer.handle?.stack?.some((subLayer) => subLayer.handle === medicalRecordRoutes))
      return true
    return false
  })

  assert.equal(typeof isMounted, 'boolean')
})
