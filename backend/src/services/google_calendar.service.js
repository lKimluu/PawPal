import { google } from 'googleapis'

// 前端以彈出視窗取得授權碼（非整頁跳轉），Google 規定此流程的 redirect_uri 固定為 'postmessage'
const POPUP_REDIRECT_URI = 'postmessage'

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    POPUP_REDIRECT_URI,
  )
}

export async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  return {
    access_token: tokens.access_token ?? null,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: tokens.expiry_date ?? null,
    scope: tokens.scope ?? '',
  }
}

export async function revokeGoogleToken(token) {
  if (!token) {
    return
  }

  try {
    const oauth2Client = createOAuth2Client()
    await oauth2Client.revokeToken(token)
  } catch (error) {
    // 撤銷是盡力而為（token 可能早已失效），失敗不影響主流程
    console.error('Google token 撤銷失敗:', error.message)
  }
}
