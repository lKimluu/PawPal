import { Router } from 'express'

import { listHospitalRegions, listHospitals, listMapHospitals, listNearbyHospitals } from '../controllers/hospitals.controller.js'
import { hospitalMapIpRateLimiter, hospitalMapRateLimiter } from '../config/rate_limit.js'
import {
  createHospitalReview,
  deleteMyHospitalReview,
  listHospitalReviews,
  updateMyHospitalReview,
} from '../controllers/hospital_reviews.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import {
  hospitalReviewBodySchema,
  hospitalReviewParamsSchema,
} from '../schemas/hospital_reviews.schema.js'
import {
  hospitalsQuerySchema,
  hospitalMapQuerySchema,
  nearbyHospitalsQuerySchema,
} from '../schemas/hospitals.schema.js'

const router = Router()

router.get('/', validate(hospitalsQuerySchema, 'query'), listHospitals)
router.get('/nearby', validate(nearbyHospitalsQuerySchema, 'query'), listNearbyHospitals)
router.get('/regions', listHospitalRegions)
router.get(
  '/map',
  hospitalMapIpRateLimiter,
  hospitalMapRateLimiter,
  validate(hospitalMapQuerySchema, 'query'),
  listMapHospitals,
)
router.get('/:hospital_id/reviews', validate(hospitalReviewParamsSchema, 'params'), listHospitalReviews)
router.post(
  '/:hospital_id/reviews',
  validate(hospitalReviewParamsSchema, 'params'),
  authenticateToken,
  validate(hospitalReviewBodySchema),
  createHospitalReview,
)
router.patch(
  '/:hospital_id/reviews/me',
  validate(hospitalReviewParamsSchema, 'params'),
  authenticateToken,
  validate(hospitalReviewBodySchema),
  updateMyHospitalReview,
)
router.delete(
  '/:hospital_id/reviews/me',
  validate(hospitalReviewParamsSchema, 'params'),
  authenticateToken,
  deleteMyHospitalReview,
)

export default router
