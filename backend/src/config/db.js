import dotenv from 'dotenv'
import { createPoolFromEnv } from './create_pool.js'

dotenv.config({ quiet: true })

export const pool = createPoolFromEnv()
