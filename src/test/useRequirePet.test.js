import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createServer } from 'vite'

async function loadModules(t) {
  const vite = await createServer({
    configFile: false,
    root: resolve('.'),
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
    resolve: {
      alias: {
        '@': resolve('src'),
      },
    },
  })
  t.after(async () => {
    await new Promise((resolveImmediate) => setImmediate(resolveImmediate))
    await vite.close()
  })

  const [{ useRequirePet }, { usePetStore }, { useToastStore }] = await Promise.all([
    vite.ssrLoadModule('/src/composables/useRequirePet.js'),
    vite.ssrLoadModule('/src/stores/petStore.js'),
    vite.ssrLoadModule('/src/stores/toast.js'),
  ])

  return { useRequirePet, usePetStore, useToastStore }
}

async function setup(t, initialPath) {
  const { useRequirePet, usePetStore, useToastStore } = await loadModules(t)

  setActivePinia(createPinia())

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
      { path: '/medical', name: 'Medical', component: { template: '<div />' } },
    ],
  })
  router.push(initialPath)
  await router.isReady()

  const pushCalls = []
  const originalPush = router.push.bind(router)
  router.push = (to) => {
    pushCalls.push(to)
    return originalPush(to)
  }

  const app = createApp({})
  app.use(router)

  const requirePet = app.runWithContext(() => useRequirePet())

  return {
    router,
    pushCalls,
    petStore: usePetStore(),
    toastStore: useToastStore(),
    requirePet,
  }
}

test('ensurePetOrPrompt 會員已有寵物時直接放行，不提示不導頁', async (t) => {
  const { requirePet, petStore, toastStore, pushCalls } = await setup(t, '/dashboard')
  petStore.pets = [{ id: 1, name: 'Momo' }]

  const result = requirePet.ensurePetOrPrompt()

  assert.equal(result, true)
  assert.deepEqual(toastStore.toasts, [])
  assert.deepEqual(pushCalls, [])
})

test('ensurePetOrPrompt 在 Dashboard 頁無寵物時只提示不導頁', async (t) => {
  const { requirePet, petStore, toastStore, pushCalls } = await setup(t, '/dashboard')
  petStore.pets = []

  const result = requirePet.ensurePetOrPrompt()

  assert.equal(result, false)
  assert.equal(toastStore.toasts.length, 1)
  assert.equal(toastStore.toasts[0].type, 'error')
  assert.deepEqual(pushCalls, [])
})

test('ensurePetOrPrompt 在非 Dashboard 頁無寵物時提示並導頁至 /dashboard', async (t) => {
  const { requirePet, petStore, toastStore, pushCalls } = await setup(t, '/medical')
  petStore.pets = []

  const result = requirePet.ensurePetOrPrompt()

  assert.equal(result, false)
  assert.equal(toastStore.toasts.length, 1)
  assert.equal(toastStore.toasts[0].type, 'error')
  assert.deepEqual(pushCalls, ['/dashboard'])
})
