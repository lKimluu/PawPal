import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { createServer } from 'vite'

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
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
    name: 'AppHeader',
    path: '../components/layout/AppHeader.vue',
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

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

function createQueuedApiMock() {
  const calls = []

  function mock(...args) {
    const deferred = createDeferred()
    calls.push({ args, deferred })
    return deferred.promise
  }

  return { calls, mock }
}

async function createStoresWithMockedApis(t) {
  globalThis.localStorage = createStorage()

  const apiMocks = {
    medical: {
      getUserPets: createQueuedApiMock(),
      getRecordsByPet: createQueuedApiMock(),
      createRecord: createQueuedApiMock(),
      updateRecord: createQueuedApiMock(),
      deleteRecord: createQueuedApiMock(),
    },
    growth: {
      getGrowthRecords: createQueuedApiMock(),
      createGrowthRecord: createQueuedApiMock(),
      updateGrowthRecord: createQueuedApiMock(),
      deleteGrowthRecord: createQueuedApiMock(),
    },
    pet: {
      listPets: createQueuedApiMock(),
      createPet: createQueuedApiMock(),
      updatePet: createQueuedApiMock(),
    },
    calendar: {
      getEvents: createQueuedApiMock(),
      createEvent: createQueuedApiMock(),
      updateEvent: createQueuedApiMock(),
      deleteEvent: createQueuedApiMock(),
    },
  }

  globalThis.__sessionStoreResetApiMocks = apiMocks

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
    plugins: [
      {
        name: 'session-store-reset-api-mocks',
        enforce: 'pre',
        resolveId(id) {
          const normalizedId = id.replace(/\\/g, '/')

          if (normalizedId === '@/api/medical.js' || normalizedId.endsWith('/src/api/medical.js')) {
            return '\0session-store-reset-api-mock:medical'
          }

          if (normalizedId === '@/api/growth.js' || normalizedId.endsWith('/src/api/growth.js')) {
            return '\0session-store-reset-api-mock:growth'
          }

          if (normalizedId === '@/api/pet.js' || normalizedId.endsWith('/src/api/pet.js')) {
            return '\0session-store-reset-api-mock:pet'
          }

          if (normalizedId === '@/api/calendar.js' || normalizedId.endsWith('/src/api/calendar.js')) {
            return '\0session-store-reset-api-mock:calendar'
          }

          return null
        },
        load(id) {
          if (id === '\0session-store-reset-api-mock:medical') {
            return `
              const mocks = globalThis.__sessionStoreResetApiMocks.medical
              export const medicalApi = {
                getUserPets: (...args) => mocks.getUserPets.mock(...args),
                getRecordsByPet: (...args) => mocks.getRecordsByPet.mock(...args),
                createRecord: (...args) => mocks.createRecord.mock(...args),
                updateRecord: (...args) => mocks.updateRecord.mock(...args),
                deleteRecord: (...args) => mocks.deleteRecord.mock(...args),
              }
            `
          }

          if (id === '\0session-store-reset-api-mock:growth') {
            return `
              const mocks = globalThis.__sessionStoreResetApiMocks.growth
              export const getGrowthRecords = (...args) => mocks.getGrowthRecords.mock(...args)
              export const createGrowthRecord = (...args) => mocks.createGrowthRecord.mock(...args)
              export const updateGrowthRecord = (...args) => mocks.updateGrowthRecord.mock(...args)
              export const deleteGrowthRecord = (...args) => mocks.deleteGrowthRecord.mock(...args)
            `
          }

          if (id === '\0session-store-reset-api-mock:pet') {
            return `
              const mocks = globalThis.__sessionStoreResetApiMocks.pet
              export const listPets = (...args) => mocks.listPets.mock(...args)
              export const createPet = (...args) => mocks.createPet.mock(...args)
              export const updatePet = (...args) => mocks.updatePet.mock(...args)
            `
          }

          if (id === '\0session-store-reset-api-mock:calendar') {
            return `
              const mocks = globalThis.__sessionStoreResetApiMocks.calendar
              export const getEvents = (...args) => mocks.getEvents.mock(...args)
              export const createEvent = (...args) => mocks.createEvent.mock(...args)
              export const updateEvent = (...args) => mocks.updateEvent.mock(...args)
              export const deleteEvent = (...args) => mocks.deleteEvent.mock(...args)
            `
          }

          return null
        },
      },
    ],
  })
  t.after(async () => {
    await new Promise((resolveImmediate) => setImmediate(resolveImmediate))
    await vite.close()
    await new Promise((resolveImmediate) => setImmediate(resolveImmediate))
    delete globalThis.__sessionStoreResetApiMocks
  })

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

    const stores = {
      auth: useAuthStore(),
      calendar: useCalendarStore(),
      growth: useGrowthStore(),
      medical: useMedicalStore(),
      pet: usePetStore(),
      session: useSessionStore(),
    }
    stores.auth.token = 'account-a-token'
    return stores
  }

  return { apiMocks, setup }
}

function resetApiMockCalls(apiMocks) {
  for (const moduleMocks of Object.values(apiMocks)) {
    for (const apiMock of Object.values(moduleMocks)) {
      apiMock.calls.length = 0
    }
  }
}

test('session lifecycle 實際隔離帳號狀態', async (t) => {
  const { apiMocks, setup } = await createStoresWithMockedApis(t)

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

  await t.test('reset 後舊請求完成不會回填帳號資料', async () => {
    resetApiMockCalls(apiMocks)
    const stores = setup()

    const oldMedicalPromise = stores.medical.fetchRecords(1)
    const oldGrowthPromise = stores.growth.fetchRecords(1, 'account-a-token')
    const oldPetPromise = stores.pet.fetchPets()
    const oldCalendarPromise = stores.calendar.fetchEvents()

    stores.session.resetSessionStores()

    apiMocks.medical.getRecordsByPet.calls[0].deferred.resolve({
      data: {
        data: [
          {
            id: 'medical-a',
            title: 'A medical',
            record_type: '檢查',
            record_date: '2026-07-10T00:00:00.000Z',
          },
        ],
      },
    })
    apiMocks.growth.getGrowthRecords.calls[0].deferred.resolve({
      success: true,
      data: { records: [{ id: 'growth-a' }] },
    })
    apiMocks.pet.listPets.calls[0].deferred.resolve({
      success: true,
      data: { pets: [{ id: 'pet-a', name: 'A pet' }] },
    })
    apiMocks.calendar.getEvents.calls[0].deferred.resolve({
      success: true,
      data: [{ id: 'event-a' }],
    })

    await Promise.all([oldMedicalPromise, oldGrowthPromise, oldPetPromise, oldCalendarPromise])

    assertSessionDataReset(stores)
  })

  await t.test('reset 後新請求有效且舊請求不覆蓋新 session loading 或資料', async () => {
    resetApiMockCalls(apiMocks)
    const stores = setup()

    const oldMedicalPromise = stores.medical.fetchRecords(1)
    const oldGrowthPromise = stores.growth.fetchRecords(1, 'account-a-token')
    const oldPetPromise = stores.pet.fetchPets()
    const oldCalendarPromise = stores.calendar.fetchEvents()

    stores.session.resetSessionStores()
    stores.auth.token = 'account-b-token'

    const newMedicalPromise = stores.medical.fetchRecords(2)
    const newGrowthPromise = stores.growth.fetchRecords(2, 'account-b-token')
    const newPetPromise = stores.pet.fetchPets()
    const newCalendarPromise = stores.calendar.fetchEvents()

    apiMocks.medical.getRecordsByPet.calls[0].deferred.resolve({
      data: { data: [{ id: 'medical-a', title: 'A medical' }] },
    })
    apiMocks.growth.getGrowthRecords.calls[0].deferred.resolve({
      success: true,
      data: { records: [{ id: 'growth-a' }] },
    })
    apiMocks.pet.listPets.calls[0].deferred.resolve({
      success: true,
      data: { pets: [{ id: 'pet-a', name: 'A pet' }] },
    })
    apiMocks.calendar.getEvents.calls[0].deferred.resolve({
      success: true,
      data: [{ id: 'event-a' }],
    })

    await Promise.all([oldMedicalPromise, oldGrowthPromise, oldPetPromise, oldCalendarPromise])

    assert.deepEqual(stores.medical.records, [])
    assert.deepEqual(stores.growth.records, [])
    assert.deepEqual(stores.pet.pets, [])
    assert.deepEqual(stores.calendar.events, [])
    assert.equal(stores.medical.isLoading, true)
    assert.equal(stores.growth.isLoading, true)
    assert.equal(stores.pet.isLoading, true)
    assert.equal(stores.calendar.isLoading, true)

    apiMocks.medical.getRecordsByPet.calls[1].deferred.resolve({
      data: {
        data: [
          {
            id: 'medical-b',
            title: 'B medical',
            record_type: '檢查',
            record_date: '2026-07-10T00:00:00.000Z',
          },
        ],
      },
    })
    apiMocks.growth.getGrowthRecords.calls[1].deferred.resolve({
      success: true,
      data: { records: [{ id: 'growth-b' }] },
    })
    apiMocks.pet.listPets.calls[1].deferred.resolve({
      success: true,
      data: { pets: [{ id: 20, name: 'B pet' }] },
    })
    apiMocks.calendar.getEvents.calls[1].deferred.resolve({
      success: true,
      data: [{ id: 'event-b' }],
    })

    await Promise.all([newMedicalPromise, newGrowthPromise, newPetPromise, newCalendarPromise])

    assert.equal(stores.medical.records[0].id, 'medical-b')
    assert.equal(stores.growth.records[0].id, 'growth-b')
    assert.equal(stores.pet.pets[0].id, 20)
    assert.equal(stores.pet.selectedPetId, 20)
    assert.equal(stores.calendar.events[0].id, 'event-b')
    assert.equal(stores.medical.isLoading, false)
    assert.equal(stores.growth.isLoading, false)
    assert.equal(stores.pet.isLoading, false)
    assert.equal(stores.calendar.isLoading, false)
  })

  await t.test('stale request error 被忽略但 current-session error 維持既有處理', async () => {
    resetApiMockCalls(apiMocks)
    const originalConsoleError = console.error
    console.error = () => {}
    const stores = setup()

    try {
      const staleMedicalPromise = stores.medical.fetchRecords(1)
      const staleGrowthPromise = stores.growth.fetchRecords(1, 'account-a-token')
      const stalePetPromise = stores.pet.fetchUserPets()
      const staleCalendarPromise = stores.calendar.fetchEvents()

      stores.session.resetSessionStores()

      apiMocks.medical.getRecordsByPet.calls[0].deferred.reject({
        response: { data: { message: 'medical stale error' } },
      })
      apiMocks.growth.getGrowthRecords.calls[0].deferred.resolve({
        success: false,
        message: 'growth stale error',
      })
      apiMocks.medical.getUserPets.calls[0].deferred.reject({
        response: { data: { message: 'pet stale error' } },
      })
      apiMocks.calendar.getEvents.calls[0].deferred.resolve({
        success: false,
        message: 'calendar stale error',
      })

      await Promise.allSettled([
        staleMedicalPromise,
        staleGrowthPromise,
        stalePetPromise,
        staleCalendarPromise,
      ])

      assert.equal(stores.medical.errorMsg, '')
      assert.equal(stores.growth.errorMessage, null)
      assert.deepEqual(stores.pet.pets, [])
      assert.equal(stores.pet.selectedPetId, null)
      assert.equal(stores.calendar.error, null)

      stores.pet.pets = [{ id: 'pet-before-error' }]
      stores.pet.selectedPetId = 'pet-before-error'

      const currentMedicalPromise = stores.medical.fetchRecords(2)
      const currentGrowthPromise = stores.growth.fetchRecords(2, 'account-b-token')
      const currentPetPromise = stores.pet.fetchUserPets()
      const currentCalendarPromise = stores.calendar.fetchEvents()

      apiMocks.medical.getRecordsByPet.calls[1].deferred.reject({
        response: { data: { message: 'medical current error' } },
      })
      apiMocks.growth.getGrowthRecords.calls[1].deferred.resolve({
        success: false,
        message: 'growth current error',
      })
      apiMocks.medical.getUserPets.calls[1].deferred.reject({
        response: { data: { message: 'pet current error' } },
      })
      apiMocks.calendar.getEvents.calls[1].deferred.resolve({
        success: false,
        message: 'calendar current error',
      })

      await Promise.allSettled([
        currentMedicalPromise,
        currentGrowthPromise,
        currentPetPromise,
        currentCalendarPromise,
      ])

      assert.equal(stores.medical.errorMsg, 'medical current error')
      assert.equal(stores.growth.errorMessage, 'growth current error')
      assert.deepEqual(stores.pet.pets, [])
      assert.equal(stores.pet.selectedPetId, null)
      assert.equal(stores.calendar.error, 'calendar current error')
    } finally {
      console.error = originalConsoleError
    }
  })
})
