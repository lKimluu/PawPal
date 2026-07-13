import { pool } from '../config/db.js'

export async function getConnectionByUserId(userId) {
  const result = await pool.query(
    `
      SELECT id, user_id, google_refresh_token, google_access_token, access_token_expires_at, connected_at
      FROM google_calendar_connections
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  )

  return result.rows[0] ?? null
}

export async function upsertConnection({ userId, refreshToken, accessToken, expiresAt }) {
  const result = await pool.query(
    `
      INSERT INTO google_calendar_connections
        (user_id, google_refresh_token, google_access_token, access_token_expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        google_refresh_token = EXCLUDED.google_refresh_token,
        google_access_token = EXCLUDED.google_access_token,
        access_token_expires_at = EXCLUDED.access_token_expires_at,
        connected_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, connected_at
    `,
    [userId, refreshToken, accessToken ?? null, expiresAt ?? null],
  )

  return result.rows[0]
}

export async function updateAccessToken({ userId, accessToken, expiresAt }) {
  const result = await pool.query(
    `
      UPDATE google_calendar_connections
      SET google_access_token = $2, access_token_expires_at = $3
      WHERE user_id = $1
      RETURNING id, user_id
    `,
    [userId, accessToken ?? null, expiresAt ?? null],
  )

  return result.rows[0] ?? null
}

export async function deleteConnectionByUserId(userId) {
  const result = await pool.query(
    `
      DELETE FROM google_calendar_connections
      WHERE user_id = $1
      RETURNING id
    `,
    [userId],
  )

  return result.rows[0] ?? null
}
