import { Router } from 'express'

import { listHospitalRegions, listHospitals, listMapHospitals, listNearbyHospitals } from '../controllers/hospitals.controller.js'
import { hospitalMapIpRateLimiter, hospitalMapRateLimiter } from '../config/rate_limit.js'
import {
  addHospitalFavorite,
  removeHospitalFavorite,
} from '../controllers/hospital_favorites.controller.js'
import {
  createHospitalReview,
  deleteMyHospitalReview,
  listHospitalReviews,
  updateMyHospitalReview,
} from '../controllers/hospital_reviews.controller.js'
import { attachUserIfPresent, authenticateToken } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { hospitalFavoriteParamsSchema } from '../schemas/hospital_favorites.schema.js'
import {
  hospitalReviewBodySchema,
  hospitalReviewParamsSchema,
  hospitalReviewQuerySchema,
} from '../schemas/hospital_reviews.schema.js'
import {
  hospitalsQuerySchema,
  hospitalMapQuerySchema,
  nearbyHospitalsQuerySchema,
} from '../schemas/hospitals.schema.js'

const router = Router()

router.get('/', attachUserIfPresent, validate(hospitalsQuerySchema, 'query'), listHospitals)
router.get('/nearby', attachUserIfPresent, validate(nearbyHospitalsQuerySchema, 'query'), listNearbyHospitals)
router.get('/regions', listHospitalRegions)
router.get(
  '/map',
  hospitalMapIpRateLimiter,
  hospitalMapRateLimiter,
  validate(hospitalMapQuerySchema, 'query'),
  listMapHospitals,
)
router.get(
  '/:hospital_id/reviews',
  validate(hospitalReviewParamsSchema, 'params'),
  validate(hospitalReviewQuerySchema, 'query'),
  listHospitalReviews,
)
router.post(
  '/:hospital_id/reviews',
  authenticateToken,
  validate(hospitalReviewParamsSchema, 'params'),
  validate(hospitalReviewBodySchema),
  createHospitalReview,
)
router.patch(
  '/:hospital_id/reviews/me',
  authenticateToken,
  validate(hospitalReviewParamsSchema, 'params'),
  validate(hospitalReviewBodySchema),
  updateMyHospitalReview,
)
router.delete(
  '/:hospital_id/reviews/me',
  authenticateToken,
  validate(hospitalReviewParamsSchema, 'params'),
  deleteMyHospitalReview,
)
router.post(
  '/:hospital_id/favorite',
  authenticateToken,
  validate(hospitalFavoriteParamsSchema, 'params'),
  addHospitalFavorite,
)
router.delete(
  '/:hospital_id/favorite',
  authenticateToken,
  validate(hospitalFavoriteParamsSchema, 'params'),
  removeHospitalFavorite,
)

export default router
