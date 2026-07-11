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
    animal_types: normalize_animal_types(row.animal_types),
  }

  if (row.distance_km !== undefined) {
    hospital.distance_km = Number(Number(row.distance_km).toFixed(2))
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

export async function findHospitals(filters = {}) {
  const values = []
  const conditions = []
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
  const list_values = [...values, limit, offset]

  const hospitals_result = await pool.query(
    `
      SELECT ${HOSPITAL_SELECT_COLUMNS}
      FROM hospitals h
      LEFT JOIN hospital_animal_types hat
        ON hat.hospital_id = h.id
        AND hat.verification_status <> 'rejected'
      LEFT JOIN animal_types at
        ON at.id = hat.animal_type_id
      ${where_clause}
      GROUP BY h.id
      ORDER BY h.id ASC
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
        nearby.distance_km,
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
      LEFT JOIN hospital_animal_types hat
        ON hat.hospital_id = nearby.id
        AND hat.verification_status <> 'rejected'
      LEFT JOIN animal_types at
        ON at.id = hat.animal_type_id
      WHERE nearby.distance_km <= $${radius_index}
      GROUP BY nearby.id, nearby.name, nearby.city, nearby.district, nearby.address, nearby.phone,
        nearby.latitude, nearby.longitude, nearby.distance_km
      ORDER BY nearby.distance_km ASC
      LIMIT $${limit_index}
    `,
    values,
  )

  return result.rows.map(map_hospital_row)
}
