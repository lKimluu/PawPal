import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const routerSource = readFileSync(new URL('../router/index.js', import.meta.url), 'utf8')

test('首頁維持 eager loading，其餘頁面使用 route-level dynamic imports', () => {
  assert.match(routerSource, /import Home from '@\/views\/HomeView\.vue'/)
  assert.match(routerSource, /name: 'Home',[\s\S]*?component: Home,/)

  const lazyViews = [
    'LoginView',
    'RegisterView',
    'ForgotPasswordView',
    'MedicalView',
    'DashboardView',
    'GrowthView',
    'BaseModalPreviewView',
    'HospitalView',
    'NotFoundView',
  ]

  for (const view of lazyViews) {
    assert.match(
      routerSource,
      new RegExp(`component: \\(\\) => import\\('\\@/views/${view}\\.vue'\\)`),
    )
    assert.doesNotMatch(
      routerSource,
      new RegExp(`import \\w+ from '\\@/views/${view}\\.vue'`),
    )
  }
})
