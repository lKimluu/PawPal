import { Router } from 'express'

import { createPet, deletePet, getPet, listPets, updatePet } from '../controllers/pets.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { normalizePetMultipartBody, uploadPetAvatar } from '../middlewares/upload_image.js'
import { validate } from '../middlewares/validate.js'
import { createPetSchema, updatePetSchema } from '../schemas/pets.schema.js'

const router = Router()

router.get('/', authenticateToken, listPets)
router.get('/:id', authenticateToken, getPet)
router.post(
  '/',
  authenticateToken,
  uploadPetAvatar,
  normalizePetMultipartBody,
  validate(createPetSchema),
  createPet,
)
router.patch(
  '/:id',
  authenticateToken,
  uploadPetAvatar,
  normalizePetMultipartBody,
  validate(updatePetSchema),
  updatePet,
)
router.delete('/:id', authenticateToken, deletePet)

export default router
