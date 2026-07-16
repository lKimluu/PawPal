import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const registerFormSource = readFileSync(
  new URL('../components/auth/RegisterForm.vue', import.meta.url),
  'utf8',
).replace(/\r\n/g, '\n')

const handleSubmitBody =
  registerFormSource.match(/async function handleSubmit\(\) \{([\s\S]*?)\n\}/)?.[1] ?? ''

test('註冊成功後使用 session lifecycle 自動登入並導向 Dashboard', () => {
  assert.match(registerFormSource, /useSessionStore/)
  assert.match(handleSubmitBody, /await authStore\.register\(/)
  assert.match(handleSubmitBody, /const loginResult = await sessionStore\.login\(email\.value, password\.value\)/)
  assert.match(handleSubmitBody, /if \(!loginResult\.success\) \{/)
  assert.match(handleSubmitBody, /router\.push\('\/dashboard'\)/)
  assert.doesNotMatch(handleSubmitBody, /router\.push\('\/login'\)/)
  assert.doesNotMatch(handleSubmitBody, /setTimeout\(/)
})

test('註冊失敗或自動登入失敗時不跳轉且保留提示', () => {
  const registerFailureBranch =
    handleSubmitBody.match(/if \(!result\.success\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''
  const autoLoginFailureBranch =
    handleSubmitBody.match(/if \(!loginResult\.success\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''

  assert.ok(registerFailureBranch)
  assert.match(registerFailureBranch, /errorMessage\.value = result\.message \|\| '註冊失敗，請稍後再試'/)
  assert.match(registerFailureBranch, /toastStore\.showToast\(errorMessage\.value, 'error'\)/)
  assert.match(registerFailureBranch, /isSubmitting\.value = false/)
  assert.match(registerFailureBranch, /\breturn\b/)
  assert.doesNotMatch(registerFailureBranch, /router\.push|sessionStore\.login/)

  assert.ok(autoLoginFailureBranch)
  assert.match(
    autoLoginFailureBranch,
    /errorMessage\.value = loginResult\.message \|\| '註冊成功，但自動登入失敗，請前往登入頁面'/,
  )
  assert.match(autoLoginFailureBranch, /toastStore\.showToast\(errorMessage\.value, 'error'\)/)
  assert.match(autoLoginFailureBranch, /isSubmitting\.value = false/)
  assert.match(autoLoginFailureBranch, /\breturn\b/)
  assert.doesNotMatch(autoLoginFailureBranch, /router\.push/)
  assert.match(registerFormSource, /<RouterLink[\s\S]*to="\/login"[\s\S]*立即登入/)
})
