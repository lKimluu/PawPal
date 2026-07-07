import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import {
  normalizeMedicalRecordMultipartBody,
  uploadMedicalRecordImages,
} from '../middlewares/upload_image.js'
import { validate } from '../middlewares/validate.js'

import { createRecordSchema, updateRecordSchema } from '../schemas/medical_records.schema.js'

import {
  addRecord,
  getAllRecords,
  getPetRecords,
  getSingleRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/medical_records.controller.js'

const router = Router()

router.post(
  '/',
  authenticateToken,
  uploadMedicalRecordImages,
  normalizeMedicalRecordMultipartBody,
  validate(createRecordSchema),
  addRecord,
)
router.get('/', authenticateToken, getAllRecords)
router.get('/pet/:petId', authenticateToken, getPetRecords)
router.get('/:id', authenticateToken, getSingleRecord)
router.patch(
  '/:id',
  authenticateToken,
  uploadMedicalRecordImages,
  normalizeMedicalRecordMultipartBody,
  validate(updateRecordSchema),
  updateRecord,
)
router.delete('/:id', authenticateToken, deleteRecord)

export default router
