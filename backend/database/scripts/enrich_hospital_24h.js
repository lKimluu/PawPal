import axios from 'axios'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { createPoolFromEnv } from '../../src/config/create_pool.js'

dotenv.config({ quiet: true })

export const TARGET_CITIES = Object.freeze(['台北市', '新北市', '基隆市'])
export const GOOGLE_PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
export const GOOGLE_PLACE_DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places'
export const PLACES_TEXT_SEARCH_FIELD_MASK = [
  'places.id',
  'places.businessStatus',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.regularOpeningHours.periods',
  'nextPageToken',
].join(',')
export const PLACE_DETAILS_FIELD_MASK = [
  'id',
  'businessStatus',
  'regularOpeningHours.periods',
].join(',')
export const SELECT_TARGET_HOSPITALS_SQL = `
  SELECT id, name, city, phone, is_24h, google_place_id, is_24h_source, is_24h_checked_at
  FROM hospitals
  WHERE REPLACE(city, '臺', '台') = ANY($1)
  ORDER BY id
`
export const UPDATE_HOSPITAL_ENRICHMENT_SQL = `
  UPDATE hospitals
  SET is_24h = $1,
      google_place_id = $2,
      is_24h_source = 'google_places',
      is_24h_checked_at = $3,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $4
`

export function normalizeCity(value) {
  if (value === null || value === undefined) return null
  const normalized = String(value).replaceAll('臺', '台').trim()
  return normalized || null
}

export function normalizePhone(value) {
  if (value === null || value === undefined) return null
  const compact = String(value).trim()
  if (!compact) return null

  let digits = compact.replace(/\D/g, '')
  if (digits.startsWith('886')) digits = `0${digits.slice(3)}`

  return digits || null
}

function isValidTime(value) {
  return value
    && Number.isInteger(value.day) && value.day >= 0 && value.day <= 6
    && Number.isInteger(value.hour) && value.hour >= 0 && value.hour <= 23
    && Number.isInteger(value.minute) && value.minute >= 0 && value.minute <= 59
}

export function classifyAlwaysOpen(place) {
  if (place?.businessStatus !== 'OPERATIONAL') return null

  const periods = place.regularOpeningHours?.periods
  if (!Array.isArray(periods) || periods.length === 0) return null
  if (!periods.every((period) => (
    isValidTime(period?.open)
    && (period.close === undefined || isValidTime(period.close))
  ))) {
    return null
  }

  const [period] = periods
  const isCanonicalAlwaysOpen = periods.length === 1
    && period.open.day === 0
    && period.open.hour === 0
    && period.open.minute === 0
    && period.close === undefined

  if (isCanonicalAlwaysOpen) return true
  if (periods.some(({ close }) => close === undefined)) return null
  return false
}

export function addressCity(formattedAddress) {
  const address = normalizeCity(formattedAddress)
  return address?.match(/(?:台北市|新北市|基隆市)/)?.[0] ?? null
}

function validateTextSearchResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Google Places Text Search response is invalid')
  }
  const places = data.places === undefined ? [] : data.places
  if (!Array.isArray(places)) throw new Error('Google Places Text Search response is invalid')
  if (data.nextPageToken !== undefined && typeof data.nextPageToken !== 'string') {
    throw new Error('Google Places Text Search next page token is invalid')
  }
  if (places.some((place) => !place || typeof place.id !== 'string' || !place.id)) {
    throw new Error('Google Places Text Search place is invalid')
  }
  return places
}

export async function discoverAlwaysOpenPlaces({ axiosClient = axios, apiKey } = {}) {
  const uniquePlaces = new Map()
  const stats = { queried: 0, fetched: 0, alwaysOpen: 0 }

  for (const city of TARGET_CITIES) {
    let pageToken

    do {
      const body = {
        textQuery: `${city} 動物醫院`,
        includedType: 'veterinary_care',
        strictTypeFiltering: true,
        languageCode: 'zh-TW',
        regionCode: 'TW',
        ...(pageToken ? { pageToken } : {}),
      }
      const response = await axiosClient.post(GOOGLE_PLACES_TEXT_SEARCH_URL, body, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': PLACES_TEXT_SEARCH_FIELD_MASK,
        },
      })
      const data = response.data
      const places = validateTextSearchResponse(data)
      stats.queried += 1
      stats.fetched += places.length

      for (const place of places) {
        const existing = uniquePlaces.get(place.id)
        const current = { place, queriedCity: city }
        if (!existing || (
          addressCity(existing.place.formattedAddress) !== existing.queriedCity
          && addressCity(place.formattedAddress) === city
        )) {
          uniquePlaces.set(place.id, current)
        }
      }

      pageToken = data.nextPageToken
    } while (pageToken)
  }

  const candidates = [...uniquePlaces.values()].filter(({ place, queriedCity }) => (
    classifyAlwaysOpen(place) === true && addressCity(place.formattedAddress) === queriedCity
  ))
  stats.alwaysOpen = candidates.length

  return { candidates, stats }
}

export function matchPlaceToHospital(place, queriedCity, hospitals) {
  const city = normalizeCity(queriedCity)
  if (!city || addressCity(place?.formattedAddress) !== city) return { status: 'outside_city' }

  const phone = normalizePhone(place?.nationalPhoneNumber)
  if (!phone) return { status: 'unmatched' }

  const matches = hospitals.filter((hospital) => (
    normalizeCity(hospital.city) === city && normalizePhone(hospital.phone) === phone
  ))

  if (matches.length === 0) return { status: 'unmatched' }
  if (matches.length > 1) return { status: 'ambiguous' }
  return { status: 'matched', hospital: matches[0] }
}

export function buildDiscoveryUpdatePlan({ candidates, hospitals }) {
  const linkedByPlaceId = new Map(
    hospitals
      .filter((hospital) => hospital.google_place_id)
      .map((hospital) => [hospital.google_place_id, hospital]),
  )
  const plannedHospitalIds = new Set()
  const updates = []
  const stats = { matched: 0, unmatched: 0, ambiguous: 0, conflicts: 0 }

  for (const { place, queriedCity } of candidates) {
    const match = matchPlaceToHospital(place, queriedCity, hospitals)
    if (match.status === 'ambiguous') {
      stats.ambiguous += 1
      continue
    }
    if (match.status !== 'matched') {
      stats.unmatched += 1
      continue
    }

    const hospital = match.hospital
    const linkedHospital = linkedByPlaceId.get(place.id)
    if (linkedHospital) {
      if (linkedHospital.id !== hospital.id) stats.conflicts += 1
      continue
    }
    if (hospital.google_place_id || plannedHospitalIds.has(hospital.id)) {
      stats.conflicts += 1
      continue
    }

    plannedHospitalIds.add(hospital.id)
    updates.push({ hospitalId: hospital.id, placeId: place.id, is24h: true })
    stats.matched += 1
  }

  return { updates, stats }
}

function validatePlaceDetails(data, placeId) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.id !== placeId) {
    throw new Error('Google Place Details response is invalid')
  }
}

export async function refreshLinkedPlaces({ hospitals, axiosClient = axios, apiKey } = {}) {
  const linkedHospitals = hospitals.filter((hospital) => (
    TARGET_CITIES.includes(normalizeCity(hospital.city)) && hospital.google_place_id
  ))
  const updates = []

  for (const hospital of linkedHospitals) {
    const placeId = hospital.google_place_id
    const response = await axiosClient.get(
      `${GOOGLE_PLACE_DETAILS_BASE_URL}/${encodeURIComponent(placeId)}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': PLACE_DETAILS_FIELD_MASK,
        },
      },
    )
    validatePlaceDetails(response.data, placeId)
    const is24h = classifyAlwaysOpen(response.data)
    if (is24h === null) continue
    updates.push({ hospitalId: hospital.id, placeId, is24h })
  }

  return { updates, refreshed: updates.length }
}

export function getGooglePlacesApiKey(env = process.env) {
  const apiKey = env.GOOGLE_PLACES_API_KEY?.trim()
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is required')
  return apiKey
}

export async function fetchTargetHospitals(pool) {
  const result = await pool.query(SELECT_TARGET_HOSPITALS_SQL, [TARGET_CITIES])
  if (!result || !Array.isArray(result.rows)) throw new Error('Hospital query response is invalid')
  return result.rows
}

function formatStats(stats) {
  return Object.entries(stats).map(([key, value]) => `${key}=${value}`).join(', ')
}

export async function applyEnrichmentUpdates(pool, updatePlan, checkedAt) {
  if (updatePlan.length === 0) return 0

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const update of updatePlan) {
      const result = await client.query(UPDATE_HOSPITAL_ENRICHMENT_SQL, [
        update.is24h,
        update.placeId,
        checkedAt,
        update.hospitalId,
      ])
      if (result.rowCount !== 1) {
        throw new Error(`Hospital enrichment update affected ${result.rowCount} rows for id=${update.hospitalId}`)
      }
    }
    await client.query('COMMIT')
    return updatePlan.length
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function enrichHospital24h({
  pool,
  axiosClient = axios,
  env = process.env,
  logger = console,
  clock = () => new Date(),
  write = false,
} = {}) {
  const apiKey = getGooglePlacesApiKey(env)
  const hospitals = await fetchTargetHospitals(pool)
  const [discovery, refresh] = await Promise.all([
    discoverAlwaysOpenPlaces({ axiosClient, apiKey }),
    refreshLinkedPlaces({ hospitals, axiosClient, apiKey }),
  ])
  const discoveryPlan = buildDiscoveryUpdatePlan({
    candidates: discovery.candidates,
    hospitals,
  })
  const updatePlan = [...discoveryPlan.updates, ...refresh.updates]
  const stats = {
    ...discovery.stats,
    ...discoveryPlan.stats,
    refreshed: refresh.refreshed,
    wouldUpdate: new Set(updatePlan.map(({ hospitalId }) => hospitalId)).size,
    updated: 0,
  }

  if (write) stats.updated = await applyEnrichmentUpdates(pool, updatePlan, clock())

  logger.info(`Hospital 24H enrichment complete: ${formatStats(stats)}`)
  return stats
}

export function parseCliArgs(argv = process.argv.slice(2)) {
  const unknown = argv.find((argument) => argument !== '--write')
  if (unknown) throw new Error(`Unknown argument: ${unknown}`)
  if (argv.filter((argument) => argument === '--write').length > 1) {
    throw new Error('--write may only be provided once')
  }
  return { write: argv.includes('--write') }
}

export async function runHospital24hCli({
  argv = process.argv.slice(2),
  createPool = createPoolFromEnv,
  ...dependencies
} = {}) {
  const { write } = parseCliArgs(argv)
  const pool = createPool()
  try {
    return await enrichHospital24h({ ...dependencies, pool, write })
  } finally {
    await pool.end()
  }
}

export { createPoolFromEnv }

async function main() {
  try {
    await runHospital24hCli()
  } catch (error) {
    console.error('Hospital 24H enrichment failed:', error.message)
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
