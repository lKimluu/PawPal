import { pool } from '../config/db.js'

export async function findGrowthRecords(userId, petId, metricType) {
  const params = [petId, userId]
  let query = `
    SELECT gr.id, gr.pet_id, gr.metric_type, gr.value, gr.unit, gr.recorded_at, gr.notes, gr.created_at
    FROM growth_records gr
    JOIN pets ON pets.id = gr.pet_id
    WHERE gr.pet_id = $1 AND pets.user_id = $2
  `

  if (metricType) {
    params.push(metricType)
    query += ` AND gr.metric_type = $3`
  }

  query += ` ORDER BY gr.metric_type, gr.recorded_at ASC`

  const result = await pool.query(query, params)
  return result.rows
}

export async function createGrowthRecord({
  userId,
  petId,
  metricType,
  value,
  unit,
  recordedAt,
  notes,
}) {
  const petCheck = await pool.query(`SELECT id FROM pets WHERE id = $1 AND user_id = $2`, [
    petId,
    userId,
  ])

  if (petCheck.rowCount === 0) {
    return null
  }

  const result = await pool.query(
    `INSERT INTO growth_records (pet_id, metric_type, value, unit, recorded_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, pet_id, metric_type, value, unit, recorded_at, notes, created_at`,
    [petId, metricType, value, unit, recordedAt, notes ?? null],
  )
  return result.rows[0]
}

export async function updateGrowthRecord(userId, id, { value, unit, recordedAt, notes }) {
  const result = await pool.query(
    `UPDATE growth_records gr
     SET value = COALESCE($3, gr.value),
         unit = COALESCE($4, gr.unit),
         recorded_at = COALESCE($5, gr.recorded_at),
         notes = COALESCE($6, gr.notes)
     FROM pets
     WHERE gr.id = $1 AND gr.pet_id = pets.id AND pets.user_id = $2
     RETURNING gr.id, gr.pet_id, gr.metric_type, gr.value, gr.unit, gr.recorded_at, gr.notes, gr.created_at`,
    [id, userId, value ?? null, unit ?? null, recordedAt ?? null, notes ?? null],
  )
  return result.rows[0] || null
}

export async function deleteGrowthRecord(userId, id) {
  const result = await pool.query(
    `DELETE FROM growth_records
     USING pets
     WHERE growth_records.id = $1
       AND growth_records.pet_id = pets.id
       AND pets.user_id = $2
     RETURNING growth_records.id`,
    [id, userId],
  )
  return result.rows[0] || null
}
