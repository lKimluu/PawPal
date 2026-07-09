import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { createServer } from 'vite'

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

const resetContracts = [
  {
    name: 'medical',
    path: '../stores/medical.js',
    assignments: [
      /records\.value = \[\]/,
      /isLoading\.value = false/,
      /errorMsg\.value = ''/,
    ],
  },
  {
    name: 'growth',
    path: '../stores/growth.js',
    assignments: [
      /records\.value = \[\]/,
      /isLoading\.value = false/,
      /isSubmitting\.value = false/,
      /errorMessage\.value = null/,
    ],
  },
  {
    name: 'pet',
    path: '../stores/petStore.js',
    assignments: [
      /pets\.value = \[\]/,
      /selectedPetId\.value = null/,
      /isLoading\.value = false/,
    ],
  },
  {
    name: 'calendar',
    path: '../stores/calendar.js',
    assignments: [
      /events\.value = \[\]/,
      /isLoading\.value = false/,
      /error\.value = null/,
      /selectedPetId\.value = 'all'/,
    ],
  },
]

for (const contract of resetContracts) {
  test(`${contract.name} store 公開同步 reset contract 並還原初始狀態`, () => {
    const source = readSource(contract.path)
    const resetBody = source.match(/function reset\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''

    assert.ok(resetBody, `${contract.name} store 應定義 reset()`)
    assert.match(source, /\breset,\n\s*\}/)

    for (const assignment of contract.assignments) {
      assert.match(resetBody, assignment)
    }

    assert.doesNotMatch(resetBody, /\bawait\b|\bfetch\(|Api\./)
  })
}

test('session store 集中重置所有使用者資料 store', () => {
  const source = readSource('../stores/session.js')
  const resetBody = source.match(/function resetSessionStores\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''

  assert.ok(resetBody)
  assert.match(resetBody, /medicalStore\.reset\(\)/)
  assert.match(resetBody, /growthStore\.reset\(\)/)
  assert.match(resetBody, /petStore\.reset\(\)/)
  assert.match(resetBody, /calendarStore\.reset\(\)/)
  assert.doesNotMatch(source, /useToastStore|useSidebarStore|useFavoriteHospitalStore/)
})

test('session login 只在成功後清除前一個帳號狀態', () => {
  const source = readSource('../stores/session.js')
  const loginBody = source.match(/async function login\(email, password\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''

  assert.match(loginBody, /const result = await authStore\.login\(email, password\)/)
  assert.match(loginBody, /if \(result\.success\) \{\s*resetSessionStores\(\)\s*\}/)
  assert.match(loginBody, /return result/)
  assert.ok(loginBody.indexOf('await authStore.login') < loginBody.indexOf('resetSessionStores()'))
})

test('session logout 先清除使用者資料再清除 auth', () => {
  const source = readSource('../stores/session.js')
  const logoutBody = source.match(/function logout\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''

  assert.match(logoutBody, /resetSessionStores\(\)/)
  assert.match(logoutBody, /authStore\.logout\(\)/)
  assert.ok(logoutBody.indexOf('resetSessionStores()') < logoutBody.indexOf('authStore.logout()'))
})

test('auth store 不反向 import session 或使用者資料 store', () => {
  const source = readSource('../stores/auth.js')

  assert.doesNotMatch(source, /stores\/(?:session|calendar|growth|medical|petStore)/)
})

const sessionEntryPoints = [
  {
    name: 'DashboardSidebar',
    path: '../components/layout/DashboardSidebar.vue',
    action: /sessionStore\.logout\(\)/,
  },
  {
    name: 'LoginForm',
    path: '../components/auth/LoginForm.vue',
    action: /await sessionStore\.login\(email\.value, password\.value\)/,
  },
  {
    name: 'LoginView',
    path: '../views/LoginView.vue',
    action: /await sessionStore\.login\(payload\.email, payload\.password\)/,
  },
]

for (const entryPoint of sessionEntryPoints) {
  test(`${entryPoint.name} 透過 session lifecycle 執行認證 mutation`, () => {
    const source = readSource(entryPoint.path)

    assert.match(source, /useSessionStore/)
    assert.match(source, entryPoint.action)
    assert.doesNotMatch(source, /authStore\.(?:login|logout)\(/)
  })
}

test('DashboardSidebar 不直接重置個別資料 store', () => {
  const source = readSource('../components/layout/DashboardSidebar.vue')

  assert.doesNotMatch(source, /useMedicalStore|useGrowthStore|usePetStore|useCalendarStore/)
  assert.doesNotMatch(source, /\w+Store\.reset\(\)/)
})

function createStorage() {
  const values = new Map()

  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
    clear() {
      values.clear()
    },
  }
}

function seedAccountA({ medical, growth, pet, calendar }) {
  medical.records = [{ id: 'record-12' }]
  medical.isLoading = true
  medical.errorMsg = 'medical error'
  growth.records = [{ id: 'growth-8' }]
  growth.isLoading = true
  growth.isSubmitting = true
  growth.errorMessage = 'growth error'
  pet.pets = [{ id: 'pet-3' }]
  pet.selectedPetId = 'pet-3'
  pet.isLoading = true
  calendar.events = [{ id: 'event-5' }]
  calendar.selectedPetId = 'pet-3'
  calendar.isLoading = true
  calendar.error = 'calendar error'
}

function assertSessionDataReset({ medical, growth, pet, calendar }) {
  assert.deepEqual(medical.records, [])
  assert.equal(medical.isLoading, false)
  assert.equal(medical.errorMsg, '')
  assert.deepEqual(growth.records, [])
  assert.equal(growth.isLoading, false)
  assert.equal(growth.isSubmitting, false)
  assert.equal(growth.errorMessage, null)
  assert.deepEqual(pet.pets, [])
  assert.equal(pet.selectedPetId, null)
  assert.equal(pet.isLoading, false)
  assert.deepEqual(calendar.events, [])
  assert.equal(calendar.selectedPetId, 'all')
  assert.equal(calendar.isLoading, false)
  assert.equal(calendar.error, null)
}

test('session lifecycle 實際隔離帳號狀態', async (t) => {
  globalThis.localStorage = createStorage()

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
  t.after(() => vite.close())

  const [
    { useAuthStore },
    { useCalendarStore },
    { useGrowthStore },
    { useMedicalStore },
    { usePetStore },
    { useSessionStore },
  ] = await Promise.all([
    vite.ssrLoadModule('/src/stores/auth.js'),
    vite.ssrLoadModule('/src/stores/calendar.js'),
    vite.ssrLoadModule('/src/stores/growth.js'),
    vite.ssrLoadModule('/src/stores/medical.js'),
    vite.ssrLoadModule('/src/stores/petStore.js'),
    vite.ssrLoadModule('/src/stores/session.js'),
  ])

  function setup() {
    localStorage.clear()
    setActivePinia(createPinia())

    return {
      auth: useAuthStore(),
      calendar: useCalendarStore(),
      growth: useGrowthStore(),
      medical: useMedicalStore(),
      pet: usePetStore(),
      session: useSessionStore(),
    }
  }

  await t.test('A 帳號登出後清除資料與 auth storage', () => {
    const stores = setup()
    seedAccountA(stores)
    stores.auth.token = 'account-a-token'
    stores.auth.user = { id: 'account-a' }
    localStorage.setItem('pawpal_token', 'account-a-token')
    localStorage.setItem('pawpal_user', JSON.stringify(stores.auth.user))

    stores.session.logout()

    assertSessionDataReset(stores)
    assert.equal(stores.auth.token, '')
    assert.equal(stores.auth.user, null)
    assert.equal(localStorage.getItem('pawpal_token'), null)
    assert.equal(localStorage.getItem('pawpal_user'), null)
  })

  await t.test('成功切換 B 帳號後清除 A 帳號資料', async () => {
    const stores = setup()
    seedAccountA(stores)
    stores.auth.login = async () => ({
      success: true,
      data: { token: 'account-b-token', user: { id: 'account-b' } },
    })

    const result = await stores.session.login('b@example.com', 'password')

    assert.equal(result.success, true)
    assertSessionDataReset(stores)
  })

  await t.test('登入失敗時保留目前帳號資料', async () => {
    const stores = setup()
    seedAccountA(stores)
    stores.auth.login = async () => ({ success: false, message: '帳號或密碼錯誤' })

    const result = await stores.session.login('b@example.com', 'wrong-password')

    assert.equal(result.success, false)
    assert.deepEqual(stores.medical.records, [{ id: 'record-12' }])
    assert.deepEqual(stores.growth.records, [{ id: 'growth-8' }])
    assert.deepEqual(stores.pet.pets, [{ id: 'pet-3' }])
    assert.equal(stores.pet.selectedPetId, 'pet-3')
    assert.deepEqual(stores.calendar.events, [{ id: 'event-5' }])
  })
})
