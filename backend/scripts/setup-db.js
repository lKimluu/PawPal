import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createPoolFromEnv } from '../src/config/create_pool.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scriptPath = fileURLToPath(import.meta.url)

const pool = createPoolFromEnv()

export const TABLES_IN_ORDER = [
  'users',
  'pets',
  'calendar_events',
  'medical_records',
  'growth_records',
  'hospitals',
  'animal_types',
  'hospital_animal_types',
]

export const SEED_FILES_IN_ORDER = [
  'users',
  'pets',
  'calendar_events',
  'medical_records',
  'growth_records',
  'animal_types.seed',
]

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8')
  await pool.query(sql)
}

export async function setup() {
  try {
    for (const table of TABLES_IN_ORDER) {
      const filePath = path.join(__dirname, '../database/schema', `${table}.sql`)
      await runSqlFile(filePath)
    }

    if (process.env.SEED_DB === 'true') {
      for (const table of SEED_FILES_IN_ORDER) {
        const filePath = path.join(__dirname, '../database/seeds', `${table}.sql`)
        await runSqlFile(filePath)
      }
    }
  } catch (error) {
    console.error('Database setup failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (process.argv[1] === scriptPath) {
  setup()
}
