import * as defaultHospitalService from '../services/hospitals.service.js'

export function createHospitalsController(hospitalService) {
  async function listHospitals(req, res) {
    try {
      const query = req.validated_query ?? req.query
      const result = await hospitalService.findHospitals(query)

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

  return {
    listHospitals,
    listNearbyHospitals,
  }
}

export const { listHospitals, listNearbyHospitals } =
  createHospitalsController(defaultHospitalService)
