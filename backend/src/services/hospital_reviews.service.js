import { pool } from '../config/db.js'

export class DuplicateHospitalReviewError extends Error {
  constructor() {
    super('Duplicate hospital review')
    this.name = 'DuplicateHospitalReviewError'
  }
}

export class HospitalReviewNotFoundError extends Error {
  constructor() {
    super('Hospital review not found')
    this.name = 'HospitalReviewNotFoundError'
  }
}

function map_review_row(row) {
  const review = {
    id: row.id,
    hospital_id: row.hospital_id,
    user_id: row.user_id,
    rating: Number(row.rating),
    comment: row.comment,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  if (Object.hasOwn(row, 'user_name')) review.user_name = row.user_name
  if (Object.hasOwn(row, 'user_avatar_url')) review.user_avatar_url = row.user_avatar_url

  return review
}

function is_duplicate_hospital_review(error) {
  return error?.code === '23505' && error?.constraint === 'uq_hospital_reviews_user_hospital'
}

export async function listHospitalReviews(hospitalId) {
  const result = await pool.query(
    `
      SELECT
        hr.id,
        hr.hospital_id,
        hr.user_id,
        u.name AS user_name,
        u.avatar_url AS user_avatar_url,
        hr.rating,
        hr.comment,
        hr.created_at,
        hr.updated_at
      FROM hospital_reviews hr
      INNER JOIN users u
        ON u.id = hr.user_id
      WHERE hr.hospital_id = $1
      ORDER BY hr.created_at DESC, hr.id DESC
    `,
    [hospitalId],
  )

  return result.rows.map(map_review_row)
}

export async function createHospitalReview(hospitalId, userId, data) {
  try {
    const result = await pool.query(
      `
        INSERT INTO hospital_reviews (hospital_id, user_id, rating, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING id, hospital_id, user_id, rating, comment, created_at, updated_at
      `,
      [hospitalId, userId, data.rating, data.comment],
    )

    return map_review_row(result.rows[0])
  } catch (error) {
    if (is_duplicate_hospital_review(error)) {
      throw new DuplicateHospitalReviewError()
    }

    throw error
  }
}

export async function updateMyHospitalReview(hospitalId, userId, data) {
  const result = await pool.query(
    `
      UPDATE hospital_reviews
      SET rating = $1,
          comment = $2
      WHERE hospital_id = $3
        AND user_id = $4
      RETURNING id, hospital_id, user_id, rating, comment, created_at, updated_at
    `,
    [data.rating, data.comment, hospitalId, userId],
  )

  if (!result.rows[0]) {
    throw new HospitalReviewNotFoundError()
  }

  return map_review_row(result.rows[0])
}

export async function deleteMyHospitalReview(hospitalId, userId) {
  const result = await pool.query(
    `
      DELETE FROM hospital_reviews
      WHERE hospital_id = $1
        AND user_id = $2
    `,
    [hospitalId, userId],
  )

  if (result.rowCount === 0) {
    throw new HospitalReviewNotFoundError()
  }

  return true
}
