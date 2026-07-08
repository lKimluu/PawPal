import { Router } from 'express'

import { listHospitals, listNearbyHospitals } from '../controllers/hospitals.controller.js'
import { validate } from '../middlewares/validate.js'
import {
  hospitalsQuerySchema,
  nearbyHospitalsQuerySchema,
} from '../schemas/hospitals.schema.js'

const router = Router()

router.get('/', validate(hospitalsQuerySchema, 'query'), listHospitals)
router.get('/nearby', validate(nearbyHospitalsQuerySchema, 'query'), listNearbyHospitals)

export default router
