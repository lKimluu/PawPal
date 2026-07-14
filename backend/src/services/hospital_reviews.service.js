import { pool } from '../config/db.js'

function toNumber(value, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function mapReviewRow(row) {
  return {
    id: row.id,
    hospital_id: row.hospital_id,
    user_id: row.user_id,
    user_name: row.user_name ?? '',
    rating: Number(row.rating),
    comment: row.comment,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function hospitalExists(hospitalId) {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM hospitals
        WHERE id = $1
      ) AS exists
    `,
    [hospitalId],
  )

  return Boolean(result.rows[0]?.exists)
}

export async function findHospitalReviewSummary(hospitalId) {
  const result = await pool.query(
    `
      SELECT
        ROUND(AVG(rating)::numeric, 1) AS average_rating,
        COUNT(*)::int AS review_count
      FROM hospital_reviews
      WHERE hospital_id = $1
    `,
    [hospitalId],
  )
  const row = result.rows[0] ?? {}

  return {
    average_rating: toNumber(row.average_rating),
    review_count: toNumber(row.review_count),
  }
}

export async function findHospitalReviews(hospitalId) {
  const result = await pool.query(
    `
      SELECT
        hr.id,
        hr.hospital_id,
        hr.user_id,
        COALESCE(u.name, '') AS user_name,
        hr.rating,
        hr.comment,
        hr.created_at,
        hr.updated_at
      FROM hospital_reviews AS hr
      LEFT JOIN users AS u ON u.id = hr.user_id
      WHERE hr.hospital_id = $1
      ORDER BY hr.created_at DESC, hr.id DESC
      LIMIT 50
    `,
    [hospitalId],
  )

  return result.rows.map(mapReviewRow)
}

export async function createHospitalReview({ hospitalId, userId, rating, comment }) {
  const result = await pool.query(
    `
      INSERT INTO hospital_reviews (hospital_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING id, hospital_id, user_id, '' AS user_name, rating, comment, created_at, updated_at
    `,
    [hospitalId, userId, rating, comment],
  )

  return mapReviewRow(result.rows[0])
}

export async function updateHospitalReview({ reviewId, hospitalId, userId, rating, comment }) {
  const result = await pool.query(
    `
      UPDATE hospital_reviews
      SET rating = $1,
          comment = $2,
          updated_at = NOW()
      WHERE id = $3
        AND hospital_id = $4
        AND user_id = $5
      RETURNING id, hospital_id, user_id, '' AS user_name, rating, comment, created_at, updated_at
    `,
    [rating, comment, reviewId, hospitalId, userId],
  )

  return result.rows[0] ? mapReviewRow(result.rows[0]) : null
}

export async function deleteHospitalReview({ reviewId, hospitalId, userId }) {
  const result = await pool.query(
    `
      DELETE FROM hospital_reviews
      WHERE id = $1
        AND hospital_id = $2
        AND user_id = $3
    `,
    [reviewId, hospitalId, userId],
  )

  return result.rowCount > 0
}
