import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appHeader = readFileSync(
  new URL('../components/layout/AppHeader.vue', import.meta.url),
  'utf8',
)
const publicSidebar = readFileSync(
  new URL('../components/layout/PublicSidebar.vue', import.meta.url),
  'utf8',
)
const dashboardSidebar = readFileSync(
  new URL('../components/layout/DashboardSidebar.vue', import.meta.url),
  'utf8',
)

test('Header 未登入按鈕使用較大的文字與登入 icon', () => {
  assert.match(appHeader, /class="group flex h-12[\s\S]*text-base[\s\S]*hover:text-brand-orange/)
  assert.match(appHeader, /import loginIcon from '@\/assets\/icons\/login\.svg'/)
  assert.match(appHeader, /:src="loginIcon" alt="" class="auth-action-icon size-6/)
  assert.match(appHeader, /class="auth-action-icon size-4 shrink-0 -scale-x-100"/)
  assert.match(appHeader, /\.group:hover \.auth-action-icon[\s\S]*filter:/)
  assert.match(publicSidebar, /import loginIcon from '@\/assets\/icons\/login\.svg'/)
  assert.match(publicSidebar, /:src="loginIcon"/)
})

test('Header 與手機版 Sidebar 的關於我們皆導向 About 頁面', () => {
  assert.match(appHeader, /<RouterLink\s+to="\/about"\s+aria-label="關於我們"/)

  for (const sidebar of [publicSidebar, dashboardSidebar]) {
    assert.match(sidebar, /<RouterLink\s+to="\/about"[\s\S]*?>\s*關於我們\s*<\/RouterLink>/)
    assert.doesNotMatch(sidebar, /href="about"/)
  }
})
