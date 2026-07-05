import axios from 'axios'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { createPoolFromEnv } from '../../src/config/create_pool.js'

dotenv.config({ quiet: true })

export const MOA_HOSPITALS_URL =
  'https://data.moa.gov.tw/Service/OpenData/DataFileService.aspx'
export const MOA_HOSPITALS_DETAIL_URL = 'https://data.moa.gov.tw/open_detail.aspx?id=078'
export const MOA_UNIT_ID = '078'
export const MOA_REQUEST_TIMEOUT_MS = 15000
export const OPEN_LICENSE_STATUS = '開業'

const TAIWAN_CITY_PREFIX_PATTERN = /^[\u4e00-\u9fa5]{2,3}[縣市]/
const TAIWAN_DISTRICT_PATTERN = /^([\u4e00-\u9fa5]{1,6}(?:區|鄉|鎮|市))/

export function normalizeText(value) {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).replace(/\s+/g, ' ').trim()

  return normalized === '' ? null : normalized
}

export function parseDistrict(address) {
  const normalizedAddress = normalizeText(address)

  if (!normalizedAddress) {
    return null
  }

  const addressWithoutCity = normalizedAddress.replace(TAIWAN_CITY_PREFIX_PATTERN, '')
  const district = addressWithoutCity.match(TAIWAN_DISTRICT_PATTERN)?.[1] ?? null

  if (!district || district.includes('行政')) {
    return null
  }

  return district
}

export function normalizeHospitalRow(row) {
  const licenseNumber = normalizeText(row['字號'])
  const name = normalizeText(row['機構名稱'])
  const city = normalizeText(row['縣市'])
  const address = normalizeText(row['機構地址'])
  const phone = normalizeText(row['機構電話'])
  const licenseStatus = normalizeText(row['狀態'])

  if (!licenseNumber || !name || !city || !licenseStatus) {
    return null
  }

  return {
    license_number: licenseNumber,
    name,
    city,
    district: parseDistrict(address),
    address,
    phone,
    latitude: null,
    longitude: null,
    license_status: licenseStatus,
    is_24h: null,
    emergency_available: null,
  }
}

export function isOpenLicense(row) {
  return normalizeText(row['狀態']) === OPEN_LICENSE_STATUS
}

export async function fetchMoaHospitalRows({ axiosClient = axios } = {}) {
  const params = {
    UnitId: MOA_UNIT_ID,
  }

  let response
  try {
    response = await axiosClient.get(MOA_HOSPITALS_URL, {
      params,
      timeout: MOA_REQUEST_TIMEOUT_MS,
    })
  } catch (error) {
    if (error.response) {
      throw new Error(
        `MOA request failed: ${error.response.status} ${error.response.statusText}`,
      )
    }

    throw new Error(`MOA request failed: ${error.message}`)
  }

  const data = response.data

  if (!Array.isArray(data)) {
    throw new Error('MOA response must be an array')
  }

  return data
}

export const UPSERT_HOSPITAL_SQL = `
  INSERT INTO hospitals (
    license_number,
    name,
    city,
    district,
    address,
    phone,
    latitude,
    longitude,
    license_status,
    is_24h,
    emergency_available
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  ON CONFLICT (license_number) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    license_status = EXCLUDED.license_status,
    is_24h = EXCLUDED.is_24h,
    emergency_available = EXCLUDED.emergency_available,
    updated_at = CURRENT_TIMESTAMP
`

export function hospitalValues(hospital) {
  return [
    hospital.license_number,
    hospital.name,
    hospital.city,
    hospital.district,
    hospital.address,
    hospital.phone,
    hospital.latitude,
    hospital.longitude,
    hospital.license_status,
    hospital.is_24h,
    hospital.emergency_available,
  ]
}

export async function upsertHospital(pool, hospital) {
  await pool.query(UPSERT_HOSPITAL_SQL, hospitalValues(hospital))
}

export async function importHospitals({
  pool,
  axiosClient = axios,
  logger = console,
} = {}) {
  const sourceRows = await fetchMoaHospitalRows({ axiosClient })
  let skipped = 0
  let written = 0

  for (const sourceRow of sourceRows) {
    if (!isOpenLicense(sourceRow)) {
      skipped += 1
      continue
    }

    const hospital = normalizeHospitalRow(sourceRow)

    if (!hospital) {
      skipped += 1
      continue
    }

    await upsertHospital(pool, hospital)
    written += 1
  }

  const stats = {
    fetched: sourceRows.length,
    skipped,
    written,
  }

  logger.info(
    `Hospital import complete: fetched=${stats.fetched}, skipped=${stats.skipped}, written=${stats.written}`,
  )

  return stats
}

export { createPoolFromEnv }

async function main() {
  const pool = createPoolFromEnv()

  try {
    await importHospitals({ pool })
  } catch (error) {
    console.error('Hospital import failed:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
