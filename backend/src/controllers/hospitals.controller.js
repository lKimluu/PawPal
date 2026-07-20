import * as defaultHospitalService from '../services/hospitals.service.js'

export function createHospitalsController(hospitalService) {
  async function listHospitals(req, res) {
    try {
      const query = req.validated_query ?? req.query

      if (query.favorites_only && !req.userId) {
        return res.status(401).json({ message: '請先登入後查看收藏清單' })
      }

      const result = await hospitalService.findHospitals(query, { userId: req.userId })

      return res.status(200).json(result)
    } catch (error) {
      console.error(error)

      return res.status(500).json({ message: '取得醫院清單失敗，請稍後再試' })
    }
  }

  async function listNearbyHospitals(req, res) {
    try {
      const query = req.validated_query ?? req.query
      const hospitals = await hospitalService.findNearbyHospitals(query)

      return res.status(200).json({ hospitals })
    } catch (error) {
      console.error(error)

      return res.status(500).json({ message: '取得附近醫院失敗，請稍後再試' })
    }
  }

  async function listHospitalRegions(_req, res) {
    try {
      return res.status(200).json({ regions: await hospitalService.findHospitalRegions() })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: '取得醫院地區失敗，請稍後再試' })
    }
  }

  async function listMapHospitals(req, res) {
    try {
      return res.status(200).json(await hospitalService.findMapHospitals(req.validated_query ?? req.query))
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: '取得地圖醫院失敗，請稍後再試' })
    }
  }

  return {
    listHospitals,
    listNearbyHospitals,
    listHospitalRegions,
    listMapHospitals,
  }
}

export const { listHospitals, listNearbyHospitals, listHospitalRegions, listMapHospitals } =
  createHospitalsController(defaultHospitalService)
