import dotenv from 'dotenv'
import pg from 'pg'
import { createPoolFromEnv } from './create_pool.js'

dotenv.config({ quiet: true })

const { types } = pg

// PostgreSQL DATE (oid 1082) 預設會被 pg 轉成 JS Date，JSON 序列化後帶時區位移
// （例如存 2026-07-11 會變成 2026-07-10T16:00:00.000Z）。
// 讓 DATE 直接回傳原始 'YYYY-MM-DD' 字串，避免前端日期位移與字串比對失敗。
types.setTypeParser(1082, (value) => value)

export const pool = createPoolFromEnv()
