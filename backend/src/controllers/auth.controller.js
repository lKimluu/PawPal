import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, findUserByEmail } from '../services/auth.service.js'
import { OAuth2Client } from 'google-auth-library'

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function register(req, res) {
  const { name, email, password } = req.body

  try {
    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      return res.status(409).json({
        message: '此 Email 已被註冊',
      })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await createUser({
      name,
      email,
      password: hashedPassword,
    })

    return res.status(201).json({
      message: '註冊成功',
      user,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: '註冊失敗，請稍後再試',
    })
  }
}

export async function login(req, res) {
  const { email, password } = req.body

  try {
    const user = await findUserByEmail(email)

    if (!user) {
      return res.status(401).json({
        message: '帳號或密碼錯誤',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        message: '帳號或密碼錯誤',
      })
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured')

      return res.status(500).json({
        message: '登入失敗，請稍後再試',
      })
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    return res.status(200).json({
      message: '登入成功',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: '登入失敗，請稍後再試',
    })
  }
}

export async function googleLogin(req, res) {
  const { token } = req.body

  try {
    let email = null
    let name = null
    let picture = null

    if (!token) {
      return res.status(400).json({ message: '前端未傳送 Google 驗證憑證' })
    }

    if (token.startsWith('ya29.')) {
      const tokenInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`,
      )

      if (!tokenInfoResponse.ok) {
        return res.status(401).json({ message: 'Google Access Token 驗證失敗' })
      }

      const tokenInfo = await tokenInfoResponse.json()
      const targetClientID = process.env.GOOGLE_CLIENT_ID

      if (tokenInfo.aud !== targetClientID && tokenInfo.azp !== targetClientID) {
        return res.status(403).json({ message: '安全性檢查失敗：憑證核發對象不符' })
      }

      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`,
      )

      if (!response.ok) {
        throw new Error('無法取得 Google 用戶資料')
      }

      const userData = await response.json()
      email = userData.email
      name = userData.name
      picture = userData.picture
    } else {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      email = payload.email
      name = payload.name
      picture = payload.picture
    }

    if (!email) {
      return res.status(400).json({ message: '無法從 Google 帳號獲取有效的 Email' })
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured')
      return res.status(500).json({ message: '登入失敗，請稍後再試' })
    }

    let user = await findUserByEmail(email)

    if (!user) {
      const randomPassword = Math.random().toString(36).substring(2, 15)
      const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS)

      user = await createUser({
        name: name || 'Google 用戶',
        email,
        avatar_url: picture || null,
        password: hashedPassword,
      })
    }

    const pawpalToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    })

    return res.status(200).json({
      message: 'Google 登入成功',
      token: pawpalToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error('Google 憑證後端驗證失敗:', error)
    return res.status(401).json({ message: 'Google 身分驗證失敗，請稍後再試' })
  }
}

export async function lineLogin(req, res) {
  const { code, redirectUri } = req.body

  try {
    const lineChannelId = process.env.LINE_CHANNEL_ID
    const lineChannelSecret = process.env.LINE_CHANNEL_SECRET

    if (!lineChannelId || !lineChannelSecret) {
      console.error('後端環境變數 LINE 金鑰未正確設定')
      return res.status(500).json({ message: '登入失敗，伺服器配置錯誤' })
    }

    if (!redirectUri) {
      return res.status(400).json({ message: '前端未提供 redirectUri' })
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured')
      return res.status(500).json({ message: '登入失敗，請稍後再試' })
    }

    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: lineChannelId,
        client_secret: lineChannelSecret,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('LINE Token 交換失敗:', tokenData)
      return res.status(401).json({ message: 'LINE 身分驗證失效，請重新登入' })
    }

    const idToken = tokenData.id_token
    if (!idToken) {
      return res.status(400).json({ message: '未能從 LINE 取得正確的身份憑證' })
    }

    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: lineChannelId,
      }),
    })

    const verifiedPayload = await verifyResponse.json()

    if (!verifyResponse.ok) {
      console.error('LINE ID Token 官方驗證失敗:', verifiedPayload)
      return res.status(403).json({ message: '安全性檢查失敗：LINE 憑證驗證無效' })
    }

    const { email, name, picture } = verifiedPayload

    if (!email) {
      return res.status(400).json({ message: '無法從您的 LINE 帳號獲取有效的 Email' })
    }

    let user = await findUserByEmail(email)

    if (!user) {
      const randomPassword = Math.random().toString(36).substring(2, 15)
      const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS)

      user = await createUser({
        name: name || 'LINE 用戶',
        email,
        avatar_url: picture || null,
        password: hashedPassword,
      })
    }

    const pawpalToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    })

    return res.status(200).json({
      message: 'LINE 登入成功',
      token: pawpalToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error('LINE 登入後端驗證失敗:', error)
    return res.status(500).json({ message: 'LINE 登入失敗，請稍後再試' })
  }
}
