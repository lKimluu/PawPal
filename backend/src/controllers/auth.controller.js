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
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const { email, name } = payload

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
        password: hashedPassword,
      })
    }

    const pawpalToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

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
