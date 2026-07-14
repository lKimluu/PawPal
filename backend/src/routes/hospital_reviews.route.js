import { Router } from 'express'

import {
  createHospitalReview,
  deleteHospitalReview,
  listHospitalReviews,
  updateHospitalReview,
} from '../controllers/hospital_reviews.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import {
  createHospitalReviewSchema,
  updateHospitalReviewSchema,
} from '../schemas/hospital_reviews.schema.js'

const router = Router({ mergeParams: true })

router.get('/', listHospitalReviews)
router.post('/', authenticateToken, validate(createHospitalReviewSchema), createHospitalReview)
router.patch('/:reviewId', authenticateToken, validate(updateHospitalReviewSchema), updateHospitalReview)
router.delete('/:reviewId', authenticateToken, deleteHospitalReview)

export default router
