import { Router } from 'express'

import { listHospitalRegions, listHospitals, listMapHospitals, listNearbyHospitals } from '../controllers/hospitals.controller.js'
import { validate } from '../middlewares/validate.js'
import {
  hospitalsQuerySchema,
  hospitalMapQuerySchema,
  nearbyHospitalsQuerySchema,
} from '../schemas/hospitals.schema.js'

const router = Router()

router.get('/', validate(hospitalsQuerySchema, 'query'), listHospitals)
router.get('/nearby', validate(nearbyHospitalsQuerySchema, 'query'), listNearbyHospitals)
router.get('/regions', listHospitalRegions)
router.get('/map', validate(hospitalMapQuerySchema, 'query'), listMapHospitals)

export default router
