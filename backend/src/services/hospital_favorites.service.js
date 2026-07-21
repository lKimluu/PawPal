import { pool } from '../config/db.js'

export class DuplicateHospitalFavoriteError extends Error {
  constructor() {
    super('Duplicate hospital favorite')
    this.name = 'DuplicateHospitalFavoriteError'
  }
}

export class HospitalFavoriteNotFoundError extends Error {
  constructor() {
    super('Hospital favorite not found')
    this.name = 'HospitalFavoriteNotFoundError'
  }
}

export class HospitalNotFoundError extends Error {
  constructor() {
    super('Hospital not found')
    this.name = 'HospitalNotFoundError'
  }
}

function is_duplicate_hospital_favorite(error) {
  return error?.code === '23505' && error?.constraint === 'uq_hospital_favorites_user_hospital'
}

function is_missing_hospital(error) {
  return error?.code === '23503' && error?.constraint === 'fk_hospital_favorites_hospital'
}

export async function addHospitalFavorite(hospitalId, userId) {
  try {
    await pool.query(
      `
        INSERT INTO hospital_favorites (hospital_id, user_id)
        VALUES ($1, $2)
      `,
      [hospitalId, userId],
    )
  } catch (error) {
    if (is_duplicate_hospital_favorite(error)) {
      throw new DuplicateHospitalFavoriteError()
    }

    if (is_missing_hospital(error)) {
      throw new HospitalNotFoundError()
    }

    throw error
  }
}

export async function removeHospitalFavorite(hospitalId, userId) {
  const result = await pool.query(
    `
      DELETE FROM hospital_favorites
      WHERE hospital_id = $1
        AND user_id = $2
    `,
    [hospitalId, userId],
  )

  if (result.rowCount === 0) {
    throw new HospitalFavoriteNotFoundError()
  }

  return true
}
