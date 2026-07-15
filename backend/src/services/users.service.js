import { pool } from '../config/db.js'

const USER_COLUMNS = `
  id,
  email,
  name,
  avatar_url,
  created_at
`

const updateColumnMap = {
  name: 'name',
  avatar_url: 'avatar_url',
}

export async function findUserById(id) {
  const result = await pool.query(
    `
      SELECT ${USER_COLUMNS}
      FROM users
      WHERE id = $1
    `,
    [id],
  )

  return result.rows[0] || null
}

export async function updateCurrentUser(id, userData) {
  const entries = Object.entries(userData).filter(([field]) => field in updateColumnMap)

  if (entries.length === 0) {
    return null
  }

  const setClauses = entries.map(([field], index) => `${updateColumnMap[field]} = $${index + 1}`)
  const values = entries.map(([, value]) => value)
  values.push(id)

  const result = await pool.query(
    `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length}
      RETURNING ${USER_COLUMNS}
    `,
    values,
  )

  return result.rows[0] || null
}
