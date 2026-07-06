import { pool } from '../config/db.js'

export async function getEventsByUserId(userId) {
  const result = await pool.query(
    `
      SELECT ce.*
      FROM calendar_events ce
      JOIN pets p ON ce.pet_id = p.id
      WHERE p.user_id = $1
      ORDER BY ce.event_date, ce.event_time
    `,
    [userId],
  )

  return result.rows
}

export async function createEvent({
  pet_id,
  userId,
  title,
  event_date,
  event_time,
  type,
  location,
  notes,
}) {
  const result = await pool.query(
    `
      INSERT INTO calendar_events (pet_id, title, event_date, event_time, type, location, notes)
      SELECT $1, $2, $3, $4, $5, $6, $7
      FROM pets
      WHERE id = $1 AND user_id = $8
      RETURNING *
    `,
    [pet_id, title, event_date, event_time ?? null, type, location ?? null, notes ?? null, userId],
  )

  return result.rows[0] ?? null
}

export async function updateEvent(id, fields, userId) {
  const allowed = ['title', 'event_date', 'event_time', 'type', 'location', 'notes', 'is_completed']

  const setClauses = []
  const values = []

  for (const [key, value] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = $${values.length + 1}`)
      values.push(value)
    }
  }

  if (setClauses.length === 0) return null

  const idIndex = values.length + 1
  values.push(id)
  const userIdIndex = values.length + 1
  values.push(userId)

  const result = await pool.query(
    `
      UPDATE calendar_events ce
      SET ${setClauses.join(', ')}
      FROM pets p
      WHERE ce.id = $${idIndex}
        AND ce.pet_id = p.id
        AND p.user_id = $${userIdIndex}
      RETURNING ce.*
    `,
    values,
  )

  return result.rows[0] ?? null
}

export async function deleteEvent(id, userId) {
  const result = await pool.query(
    `
      DELETE FROM calendar_events ce
      USING pets p
      WHERE ce.id = $1
        AND ce.pet_id = p.id
        AND p.user_id = $2
      RETURNING ce.id
    `,
    [id, userId],
  )

  return result.rows[0] ?? null
}
