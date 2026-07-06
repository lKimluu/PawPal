import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const { Pool, types } = pg

// PostgreSQL DATE (oid 1082) 預設會被 pg 轉成 JS Date，JSON 序列化後帶時區位移
// （例如存 2026-07-11 會變成 2026-07-10T16:00:00.000Z）。
// 讓 DATE 直接回傳原始 'YYYY-MM-DD' 字串，避免前端日期位移與字串比對失敗。
types.setTypeParser(1082, (value) => value)

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
})
