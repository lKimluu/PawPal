import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

dotenv.config()

const { Pool } = pg
const scriptPath = fileURLToPath(import.meta.url)

export const SEED_EMAILS = [
  'alice@example.com',
  'bob@example.com',
  'carol@example.com',
  'david@example.com',
  'emma@example.com',
]

export const SEED_MICROCHIP_NUMBERS = [
  '900138000000001',
  '900138000000002',
  '900138000000003',
  '900138000000004',
  '900138000000005',
]

export function createPoolFromEnv() {
  return new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
  })
}

export const DELETE_SEED_CALENDAR_EVENTS_SQL = `
WITH seed_calendar_events(owner_email, microchip_number, title, event_date, event_time, type) AS (
  VALUES
    ('alice@example.com',  '900138000000001', '年度健康檢查',  DATE '2026-07-10', TIME '10:00', 'vet'::event_type),
    ('alice@example.com',  '900138000000001', '狂犬病疫苗',     DATE '2026-08-05', TIME '14:30', 'vaccine'::event_type),
    ('alice@example.com',  '900138000000001', '寵物美容',       DATE '2026-06-25', TIME '11:00', 'grooming'::event_type),
    ('bob@example.com',    '900138000000002', '例行健診',       DATE '2026-07-03', TIME '09:30', 'vet'::event_type),
    ('bob@example.com',    '900138000000002', '餵心絲蟲預防藥', DATE '2026-06-20', NULL,         'medication'::event_type),
    ('carol@example.com',  '900138000000003', '關節炎回診',     DATE '2026-07-15', TIME '15:00', 'vet'::event_type),
    ('carol@example.com',  '900138000000003', '洗澡',           DATE '2026-06-28', TIME '13:00', 'bath'::event_type),
    ('carol@example.com',  '900138000000003', '服從訓練課程',   DATE '2026-07-01', TIME '10:00', 'training'::event_type),
    ('david@example.com',  '900138000000004', '牙齒檢查',       DATE '2026-07-20', TIME '11:30', 'vet'::event_type),
    ('david@example.com',  '900138000000004', '指甲修剪',       DATE '2026-06-22', NULL,         'grooming'::event_type),
    ('emma@example.com',   '900138000000005', '絕育術後回診',   DATE '2026-07-08', TIME '10:30', 'vet'::event_type),
    ('emma@example.com',   '900138000000005', '三合一疫苗',     DATE '2026-09-01', TIME '14:00', 'vaccine'::event_type)
)
DELETE FROM calendar_events
USING seed_calendar_events seed, pets, users
WHERE calendar_events.pet_id = pets.id
  AND pets.user_id = users.id
  AND users.email = seed.owner_email
  AND pets.microchip_number = seed.microchip_number
  AND calendar_events.title = seed.title
  AND calendar_events.event_date = seed.event_date
  AND calendar_events.event_time IS NOT DISTINCT FROM seed.event_time
  AND calendar_events.type = seed.type;
`

export const DELETE_SEED_MEDICAL_RECORDS_SQL = `
WITH seed_medical_records(owner_email, microchip_number, record_type, hospital_name, title, record_date) AS (
  VALUES
    ('alice@example.com', '900138000000001', '疫苗', 'ABC動物醫院',  '年度核心疫苗施打',       DATE '2026-05-01'),
    ('alice@example.com', '900138000000001', '體檢', 'ABC動物醫院',  '例行性體重與心絲蟲檢查', DATE '2026-02-14'),
    ('bob@example.com',   '900138000000002', '看診', '幸福動物醫院', '眼睛發炎微腫',           DATE '2026-06-05'),
    ('carol@example.com', '900138000000003', '用藥', '毛孩醫院',     '皮膚過敏藥浴',           DATE '2026-03-12'),
    ('david@example.com', '900138000000004', '看診', '幸福動物醫院', '腸胃不適複診',           DATE '2026-04-08'),
    ('david@example.com', '900138000000004', '疫苗', '毛孩動物醫院', '年度兔瘟疫苗施打',       DATE '2025-11-20'),
    ('emma@example.com',  '900138000000005', '看診', '安心動物醫院', '皮膚紅腫回診',           DATE '2026-06-13'),
    ('emma@example.com',  '900138000000005', '體檢', '汪喵專科醫院', '年度健康血檢',           DATE '2026-03-15')
)
DELETE FROM medical_records
USING seed_medical_records seed, pets, users
WHERE medical_records.pet_id = pets.id
  AND pets.user_id = users.id
  AND users.email = seed.owner_email
  AND pets.microchip_number = seed.microchip_number
  AND medical_records.record_type = seed.record_type
  AND medical_records.hospital_name IS NOT DISTINCT FROM seed.hospital_name
  AND medical_records.title = seed.title
  AND medical_records.record_date = seed.record_date;
`

export const DELETE_SEED_GROWTH_RECORDS_SQL = `
WITH seed_growth_records(microchip_number, metric_type, value, unit, recorded_at) AS (
  VALUES
    ('900138000000001', 'weight', 5.20, 'kg', TIMESTAMP '2021-06-15 10:00:00'),
    ('900138000000001', 'weight', 7.10, 'kg', TIMESTAMP '2021-12-15 10:00:00'),
    ('900138000000001', 'weight', 8.20, 'kg', TIMESTAMP '2022-06-15 10:00:00'),
    ('900138000000002', 'weight', 2.50, 'kg', TIMESTAMP '2021-02-02 10:00:00'),
    ('900138000000002', 'weight', 3.80, 'kg', TIMESTAMP '2021-05-02 10:00:00'),
    ('900138000000002', 'weight', 4.80, 'kg', TIMESTAMP '2021-11-02 10:00:00'),
    ('900138000000003', 'weight', 8.00, 'kg', TIMESTAMP '2020-01-21 10:00:00'),
    ('900138000000003', 'weight', 12.50, 'kg', TIMESTAMP '2020-07-21 10:00:00'),
    ('900138000000003', 'weight', 16.50, 'kg', TIMESTAMP '2021-07-21 10:00:00'),
    ('900138000000004', 'weight', 0.80, 'kg', TIMESTAMP '2022-04-10 10:00:00'),
    ('900138000000004', 'weight', 1.30, 'kg', TIMESTAMP '2022-07-10 10:00:00'),
    ('900138000000004', 'weight', 1.70, 'kg', TIMESTAMP '2023-01-10 10:00:00'),
    ('900138000000005', 'weight', 3.20, 'kg', TIMESTAMP '2019-03-30 10:00:00'),
    ('900138000000005', 'weight', 4.50, 'kg', TIMESTAMP '2019-09-30 10:00:00'),
    ('900138000000005', 'weight', 5.30, 'kg', TIMESTAMP '2020-09-30 10:00:00')
)
DELETE FROM growth_records
USING seed_growth_records seed, pets
WHERE growth_records.pet_id = pets.id
  AND pets.microchip_number = seed.microchip_number
  AND growth_records.metric_type = seed.metric_type::metric_type_enum
  AND growth_records.value = seed.value
  AND growth_records.unit = seed.unit
  AND growth_records.recorded_at = seed.recorded_at;
`

export const DELETE_SEED_PETS_SQL = `
DELETE FROM pets
WHERE microchip_number = ANY($1::text[]);
`

export const DELETE_SEED_USERS_SQL = `
DELETE FROM users
WHERE email = ANY($1::text[])
  AND NOT EXISTS (
    SELECT 1
    FROM pets
    WHERE pets.user_id = users.id
  );
`

export async function clearSeedData({ pool, logger = console } = {}) {
  const db = pool ?? createPoolFromEnv()

  try {
    await db.query('BEGIN')

    const results = []
    results.push(await db.query(DELETE_SEED_CALENDAR_EVENTS_SQL))
    results.push(await db.query(DELETE_SEED_MEDICAL_RECORDS_SQL))
    results.push(await db.query(DELETE_SEED_GROWTH_RECORDS_SQL))
    results.push(await db.query(DELETE_SEED_PETS_SQL, [SEED_MICROCHIP_NUMBERS]))
    results.push(await db.query(DELETE_SEED_USERS_SQL, [SEED_EMAILS]))

    await db.query('COMMIT')

    const [calendarEvents, medicalRecords, growthRecords, pets, users] = results
    const stats = {
      calendar_events: calendarEvents.rowCount ?? 0,
      medical_records: medicalRecords.rowCount ?? 0,
      growth_records: growthRecords.rowCount ?? 0,
      pets: pets.rowCount ?? 0,
      users: users.rowCount ?? 0,
    }

    logger.info(
      `Seed data cleared: calendar_events=${stats.calendar_events}, medical_records=${stats.medical_records}, growth_records=${stats.growth_records}, pets=${stats.pets}, users=${stats.users}`,
    )

    return stats
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await db.end()
  }
}

export async function main() {
  try {
    await clearSeedData()
  } catch (error) {
    console.error('Seed data cleanup failed:', error.message)
    process.exit(1)
  }
}

if (process.argv[1] === scriptPath) {
  main()
}
