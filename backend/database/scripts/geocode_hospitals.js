import axios from 'axios'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { createPoolFromEnv } from '../../src/config/create_pool.js'

dotenv.config({ quiet: true })

export const GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

export const SELECT_HOSPITALS_MISSING_COORDINATES_SQL = `
  SELECT id, name, address
  FROM hospitals
  WHERE latitude IS NULL
     OR longitude IS NULL
  ORDER BY id
`

export const UPDATE_HOSPITAL_COORDINATES_SQL = `
  UPDATE hospitals
  SET latitude = $1,
      longitude = $2,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $3
`

export class GeocodingRequestDeniedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'GeocodingRequestDeniedError'
    this.geocodingStatus = 'REQUEST_DENIED'
  }
}

function normalizeAddress(value) {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).replace(/\s+/g, ' ').trim()

  return normalized === '' ? null : normalized
}

export function getGoogleGeocodingApiKey(env = process.env) {
  const apiKey = normalizeAddress(env.GOOGLE_GEOCODING_API_KEY)

  if (!apiKey) {
    throw new Error('GOOGLE_GEOCODING_API_KEY is required')
  }

  return apiKey
}

export async function fetchHospitalsMissingCoordinates(pool) {
  const result = await pool.query(SELECT_HOSPITALS_MISSING_COORDINATES_SQL)

  return result.rows
}

export async function geocodeAddress(
  address,
  {
    apiKey,
    axiosClient = axios,
  } = {},
) {
  const normalizedAddress = normalizeAddress(address)

  if (!normalizedAddress) {
    return null
  }

  const response = await axiosClient.get(GOOGLE_GEOCODING_URL, {
    params: {
      address: normalizedAddress,
      key: apiKey,
    },
  })
  const data = response.data
  const status = data?.status

  if (status === 'ZERO_RESULTS') {
    return null
  }

  if (status !== 'OK') {
    const message = data?.error_message
      ? `Google Geocoding failed: ${status} ${data.error_message}`
      : `Google Geocoding failed: ${status}`

    if (status === 'REQUEST_DENIED') {
      throw new GeocodingRequestDeniedError(message)
    }

    throw new Error(message)
  }

  const location = data.results?.[0]?.geometry?.location
  const latitude = Number(location?.lat)
  const longitude = Number(location?.lng)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return { latitude, longitude }
}

export async function updateHospitalCoordinates(pool, hospitalId, coordinates) {
  await pool.query(UPDATE_HOSPITAL_COORDINATES_SQL, [
    coordinates.latitude,
    coordinates.longitude,
    hospitalId,
  ])
}

function logHospital(logger, level, message, hospital, error) {
  const detail = `id=${hospital.id}, name=${hospital.name}, address=${hospital.address}`
  const errorMessage = error ? `, error=${error.message}` : ''

  logger[level](`${message}: ${detail}${errorMessage}`)
}

export async function geocodeHospitals({
  pool,
  axiosClient = axios,
  logger = console,
  env = process.env,
} = {}) {
  const apiKey = getGoogleGeocodingApiKey(env)
  const hospitals = await fetchHospitalsMissingCoordinates(pool)
  const stats = {
    total: hospitals.length,
    processed: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  }

  for (const hospital of hospitals) {
    const address = normalizeAddress(hospital.address)

    if (!address) {
      stats.skipped += 1
      logHospital(logger, 'warn', 'Hospital geocoding skipped missing address', hospital)
      continue
    }

    stats.processed += 1

    try {
      const coordinates = await geocodeAddress(address, { apiKey, axiosClient })

      if (!coordinates) {
        stats.skipped += 1
        logHospital(logger, 'warn', 'Hospital geocoding skipped no coordinates', hospital)
        continue
      }

      await updateHospitalCoordinates(pool, hospital.id, coordinates)
      stats.updated += 1
    } catch (error) {
      if (error.geocodingStatus === 'REQUEST_DENIED') {
        logHospital(logger, 'error', 'Hospital geocoding stopped by REQUEST_DENIED', hospital, error)
        throw error
      }

      stats.failed += 1
      logHospital(logger, 'error', 'Hospital geocoding failed', hospital, error)
    }
  }

  logger.info(
    `Hospital geocoding complete: total=${stats.total}, processed=${stats.processed}, updated=${stats.updated}, skipped=${stats.skipped}, failed=${stats.failed}`,
  )

  return stats
}

export { createPoolFromEnv }

async function main() {
  const pool = createPoolFromEnv()

  try {
    await geocodeHospitals({ pool })
  } catch (error) {
    console.error('Hospital geocoding failed:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
