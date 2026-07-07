import * as defaultGrowthRecordsService from '../services/growth_records.service.js'
import { METRIC_TYPES } from '../schemas/growth_records.schema.js'

export function createGrowthRecordsController(growthRecordsService) {
  async function getGrowthRecords(req, res) {
    const userId = req.userId
    const petId = Number(req.query.pet_id)
    const metricType = req.query.metric_type

    if (!Number.isSafeInteger(petId) || petId <= 0) {
      return res.status(400).json({ message: '寵物 ID 不正確，請確認後再試' })
    }

    if (metricType && !METRIC_TYPES.includes(metricType)) {
      return res.status(400).json({ message: '查無此測量類型，請確認後再試' })
    }

    const records = await growthRecordsService.findGrowthRecords(userId, petId, metricType)
    return res.status(200).json({ records })
  }

  async function createGrowthRecord(req, res) {
    const userId = req.userId
    const { pet_id, metric_type, value, unit, recorded_at, notes } = req.body

    const record = await growthRecordsService.createGrowthRecord({
      userId,
      petId: pet_id,
      metricType: metric_type,
      value,
      unit,
      recordedAt: recorded_at,
      notes,
    })

    if (!record) {
      return res.status(403).json({ message: '找不到此寵物，或沒有新增紀錄的權限' })
    }

    return res.status(201).json({ record })
  }

  async function updateGrowthRecord(req, res) {
    const userId = req.userId
    const id = Number(req.params.id)

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: '紀錄 ID 不正確，請確認後再試' })
    }

    const { value, unit, recorded_at, notes } = req.body

    const record = await growthRecordsService.updateGrowthRecord(userId, id, {
      value,
      unit,
      recordedAt: recorded_at,
      notes,
    })

    if (!record) {
      return res.status(404).json({ message: '找不到這筆成長紀錄' })
    }

    return res.status(200).json({ record })
  }

  async function deleteGrowthRecord(req, res) {
    const userId = req.userId
    const id = Number(req.params.id)

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: '紀錄 ID 不正確，請確認後再試' })
    }

    const deleted = await growthRecordsService.deleteGrowthRecord(userId, id)

    if (!deleted) {
      return res.status(404).json({ message: '找不到這筆成長紀錄' })
    }

    return res.status(204).send()
  }

  return {
    getGrowthRecords,
    createGrowthRecord,
    updateGrowthRecord,
    deleteGrowthRecord,
  }
}

export const { getGrowthRecords, createGrowthRecord, updateGrowthRecord, deleteGrowthRecord } =
  createGrowthRecordsController(defaultGrowthRecordsService)
