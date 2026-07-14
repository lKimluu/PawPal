import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appHeader = readFileSync(
  new URL('../components/layout/AppHeader.vue', import.meta.url),
  'utf8',
)

test('Header 未登入按鈕使用較大的文字與登入 icon', () => {
  assert.match(appHeader, /class="group flex h-12[\s\S]*text-base[\s\S]*hover:text-brand-orange/)
  assert.match(appHeader, /class="login-icon size-6/)
  assert.match(appHeader, /stroke="currentColor"/)
  assert.match(appHeader, /<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/)
})
