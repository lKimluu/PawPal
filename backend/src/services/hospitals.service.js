import { pool } from '../config/db.js'

const EARTH_RADIUS_KM = 6371

function to_number(value) {
  if (value === null || value === undefined) {
    return null
  }

  return Number(value)
}

function normalize_animal_types(animal_types) {
  if (!Array.isArray(animal_types)) {
    return []
  }

  return animal_types.map((animal_type) => ({
    slug: animal_type.slug,
    name: animal_type.name,
    verification_status: animal_type.verification_status,
    source: animal_type.source,
  }))
}

function map_hospital_row(row) {
  const hospital = {
    id: row.id,
    name: row.name,
    city: row.city,
    district: row.district,
    address: row.address,
    phone: row.phone,
    latitude: to_number(row.latitude),
    longitude: to_number(row.longitude),
    rating_average: row.rating_average === null || row.rating_average === undefined
      ? null
      : Number(row.rating_average),
    review_count: Number(row.review_count ?? 0),
    animal_types: normalize_animal_types(row.animal_types),
  }

  if (row.is_24h !== undefined) hospital.is_24h = Boolean(row.is_24h)
  if (row.emergency_available !== undefined) {
    hospital.emergency_available = Boolean(row.emergency_available)
  }

  if (row.distance_km !== undefined) {
    hospital.distance_km = Number(Number(row.distance_km).toFixed(2))
  }

  if (row.rating_average !== undefined) {
    const rating = Number(row.rating_average ?? 0)
    hospital.average_rating = rating
    hospital.rating = rating
  }

  if (row.review_count !== undefined) {
    hospital.review_count = Number(row.review_count ?? 0)
  }

  return hospital
}

function add_hospital_filters(filters, values, conditions) {
  if (filters.keyword) {
    values.push(`%${filters.keyword}%`)
    conditions.push(`(
      h.name ILIKE $${values.length}
      OR h.city ILIKE $${values.length}
      OR h.district ILIKE $${values.length}
      OR h.address ILIKE $${values.length}
    )`)
  }

  if (filters.city) {
    values.push(filters.city)
    conditions.push(`h.city = $${values.length}`)
  }

  if (filters.district) {
    values.push(filters.district)
    conditions.push(`h.district = $${values.length}`)
  }

  if (filters.animal_type) {
    values.push(filters.animal_type)
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM hospital_animal_types hat_filter
        INNER JOIN animal_types at_filter
          ON at_filter.id = hat_filter.animal_type_id
        WHERE hat_filter.hospital_id = h.id
          AND at_filter.slug = $${values.length}
          AND hat_filter.verification_status <> 'rejected'
      )
    `)
  }

  if (filters.is_24h !== undefined) {
    values.push(filters.is_24h)
    conditions.push(`h.is_24h = $${values.length}`)
  }
}

function build_where_clause(conditions) {
  if (conditions.length === 0) {
    return ''
  }

  return `WHERE ${conditions.join(' AND ')}`
}

const HOSPITAL_SELECT_COLUMNS = `
  h.id,
  h.name,
  h.city,
  h.district,
  h.address,
  h.phone,
  h.latitude,
  h.longitude,
  h.is_24h,
  h.emergency_available,
  review_stats.rating_average,
  COALESCE(review_stats.review_count, 0) AS review_count,
  COALESCE(
    json_agg(
      json_build_object(
        'slug', at.slug,
        'name', at.name,
        'verification_status', hat.verification_status,
        'source', hat.source
      )
      ORDER BY at.id
    ) FILTER (WHERE at.id IS NOT NULL),
    '[]'
  ) AS animal_types
`

const HOSPITAL_REVIEW_SUMMARY_JOIN = `
  LEFT JOIN LATERAL (
    SELECT
      ROUND(AVG(rating)::numeric, 1) AS rating_average,
      COUNT(*)::int AS review_count
    FROM hospital_reviews
    WHERE hospital_id = h.id
  ) review_stats ON TRUE
`

export async function findHospitals(filters = {}) {
  const uses_distance = filters.sort === 'distance'
  const values = uses_distance ? [filters.lat, filters.lng] : []
  const conditions = []
  if (uses_distance) conditions.push('$1::double precision IS NOT NULL', '$2::double precision IS NOT NULL')
  add_hospital_filters(filters, values, conditions)
  const where_clause = build_where_clause(conditions)

  const count_result = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM hospitals h
      ${where_clause}
    `,
    values,
  )

  const total = count_result.rows[0]?.total ?? 0
  const page = filters.page
  const limit = filters.limit
  const offset = (page - 1) * limit

  const distance_expression = `(${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(
    POWER(SIN((RADIANS(h.latitude::double precision) - RADIANS($1::double precision)) / 2), 2)
    + COS(RADIANS($1::double precision)) * COS(RADIANS(h.latitude::double precision))
    * POWER(SIN((RADIANS(h.longitude::double precision) - RADIANS($2::double precision)) / 2), 2)
  )))`
  const distance_select = uses_distance ? `, ${distance_expression} AS distance_km` : ''
  let order_clause = 'h.id ASC'
  if (filters.sort === 'name') {
    order_clause = 'h.city ASC, h.district ASC NULLS LAST, h.name ASC, h.id ASC'
  } else if (filters.sort === 'relevance' && filters.keyword) {
    values.push(filters.keyword)
    const keyword_index = values.length
    order_clause = `CASE
      WHEN h.name ILIKE '%' || $${keyword_index} || '%' THEN 0
      WHEN h.city ILIKE '%' || $${keyword_index} || '%' THEN 1
      WHEN h.district ILIKE '%' || $${keyword_index} || '%' THEN 2
      ELSE 3
    END ASC, h.city ASC, h.district ASC NULLS LAST, h.name ASC, h.id ASC`
  } else if (uses_distance) {
    order_clause = `${distance_expression} ASC NULLS LAST, h.id ASC`
  }
  const list_values = [...values, limit, offset]
  const hospitals_result = await pool.query(
    `
      SELECT ${HOSPITAL_SELECT_COLUMNS}${distance_select}
      FROM hospitals h
      ${HOSPITAL_REVIEW_SUMMARY_JOIN}
      LEFT JOIN hospital_animal_types hat
        ON hat.hospital_id = h.id
        AND hat.verification_status <> 'rejected'
      LEFT JOIN animal_types at
        ON at.id = hat.animal_type_id
      ${where_clause}
      GROUP BY h.id, review_stats.rating_average, review_stats.review_count
      ORDER BY ${order_clause}
      LIMIT $${list_values.length - 1}
      OFFSET $${list_values.length}
    `,
    list_values,
  )

  return {
    hospitals: hospitals_result.rows.map(map_hospital_row),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  }
}

export async function findNearbyHospitals(filters = {}) {
  const values = [filters.lat, filters.lng]
  const conditions = ['h.latitude IS NOT NULL', 'h.longitude IS NOT NULL']
  add_hospital_filters(filters, values, conditions)

  values.push(filters.radius)
  const radius_index = values.length
  values.push(filters.limit)
  const limit_index = values.length

  const distance_expression = `
    ${EARTH_RADIUS_KM} * 2 * ASIN(
      SQRT(
        POWER(SIN((RADIANS(h.latitude::double precision) - RADIANS($1::double precision)) / 2), 2)
        + COS(RADIANS($1::double precision))
        * COS(RADIANS(h.latitude::double precision))
        * POWER(SIN((RADIANS(h.longitude::double precision) - RADIANS($2::double precision)) / 2), 2)
      )
    )
  `

  const result = await pool.query(
    `
      WITH nearby AS (
        SELECT
          h.*,
          ${distance_expression} AS distance_km
        FROM hospitals h
        ${build_where_clause(conditions)}
      )
      SELECT
        nearby.id,
        nearby.name,
        nearby.city,
        nearby.district,
        nearby.address,
        nearby.phone,
        nearby.latitude,
        nearby.longitude,
        nearby.is_24h,
        nearby.emergency_available,
        nearby.distance_km,
        review_stats.rating_average,
        COALESCE(review_stats.review_count, 0) AS review_count,
        COALESCE(
          json_agg(
            json_build_object(
              'slug', at.slug,
              'name', at.name,
              'verification_status', hat.verification_status,
              'source', hat.source
            )
            ORDER BY at.id
          ) FILTER (WHERE at.id IS NOT NULL),
          '[]'
        ) AS animal_types
      FROM nearby
      LEFT JOIN LATERAL (
        SELECT
          ROUND(AVG(rating)::numeric, 1) AS rating_average,
          COUNT(*)::int AS review_count
        FROM hospital_reviews
        WHERE hospital_id = nearby.id
      ) review_stats ON TRUE
      LEFT JOIN hospital_animal_types hat
        ON hat.hospital_id = nearby.id
        AND hat.verification_status <> 'rejected'
      LEFT JOIN animal_types at
        ON at.id = hat.animal_type_id
      WHERE nearby.distance_km <= $${radius_index}
      GROUP BY nearby.id, nearby.name, nearby.city, nearby.district, nearby.address, nearby.phone,
        nearby.latitude, nearby.longitude, nearby.is_24h, nearby.emergency_available, nearby.distance_km,
        review_stats.rating_average, review_stats.review_count
      ORDER BY nearby.distance_km ASC
      LIMIT $${limit_index}
    `,
    values,
  )

  return result.rows.map(map_hospital_row)
}

export async function findHospitalRegions() {
  const result = await pool.query(`
    SELECT city, COALESCE(array_agg(DISTINCT district ORDER BY district)
      FILTER (WHERE district IS NOT NULL AND trim(district) <> ''), '{}') AS districts
    FROM hospitals
    GROUP BY city
    ORDER BY city ASC
  `)
  return result.rows.map((row) => ({ city: row.city, districts: row.districts }))
}

export async function findMapHospitals({ north, south, east, west }) {
  const values = [south, north, west, east]
  const count = await pool.query(`
    SELECT COUNT(*)::int AS total FROM hospitals h
    WHERE h.latitude BETWEEN $1 AND $2 AND h.longitude BETWEEN $3 AND $4
  `, values)
  const result = await pool.query(`
    SELECT ${HOSPITAL_SELECT_COLUMNS}
    FROM hospitals h
    ${HOSPITAL_REVIEW_SUMMARY_JOIN}
    LEFT JOIN hospital_animal_types hat ON hat.hospital_id = h.id AND hat.verification_status <> 'rejected'
    LEFT JOIN animal_types at ON at.id = hat.animal_type_id
    WHERE h.latitude BETWEEN $1 AND $2 AND h.longitude BETWEEN $3 AND $4
    GROUP BY h.id, review_stats.rating_average, review_stats.review_count
    ORDER BY h.id ASC
    LIMIT 1000
  `, values)
  const total = count.rows[0]?.total ?? 0
  return { hospitals: result.rows.map(map_hospital_row), total, truncated: total > 1000 }
}
