import * as defaultPetService from '../services/pets.service.js'
import { uploadImages as defaultUploadImages } from '../services/image_upload.service.js'
import { getGoogleEventIdsByPetId as defaultGetGoogleEventIdsByPetId } from '../services/calendar_events.service.js'
import { syncDeletedEvents as defaultSyncDeletedEvents } from '../services/calendar_events_sync.service.js'
import { PET_AVATAR_UPLOAD_INTENT_FIELD } from '../middlewares/upload_image.js'

function parsePetId(id) {
  const parsedId = Number(id)

  if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
    return null
  }

  return parsedId
}

function isUniqueViolation(error) {
  return error?.code === '23505'
}

function hasUploadedFiles(req) {
  return (req.files ?? []).length > 0
}

function stripInternalPetFields(petData) {
  const { [PET_AVATAR_UPLOAD_INTENT_FIELD]: _avatarUploadIntent, ...publicPetData } = petData
  return publicPetData
}

async function attachUploadedPetAvatar(req, uploadImages) {
  if (!hasUploadedFiles(req)) return

  const urls = await uploadImages(req.files)
  if (!urls[0]) {
    const error = new Error('圖片上傳失敗，請稍後再試')
    error.status = 502
    throw error
  }
  req.body.avatar_url = urls[0]
}

export function createPetController(
  petService,
  {
    uploadImages = defaultUploadImages,
    getGoogleEventIdsByPetId = defaultGetGoogleEventIdsByPetId,
    syncDeletedEvents = defaultSyncDeletedEvents,
  } = {},
) {
  async function listPets(req, res) {
    try {
      const pets = await petService.findPetsByUserId(req.userId)

      return res.status(200).json({ pets })
    } catch (error) {
      console.error(error)

      return res.status(500).json({ message: '取得寵物列表失敗，請稍後再試' })
    }
  }

  async function getPet(req, res) {
    const id = parsePetId(req.params.id)

    if (!id) {
      return res.status(400).json({ message: '寵物 ID 格式不正確' })
    }

    try {
      const pet = await petService.findPetByIdAndUserId(id, req.userId)

      if (!pet) {
        return res.status(404).json({ message: '找不到寵物' })
      }

      return res.status(200).json({ pet })
    } catch (error) {
      console.error(error)

      return res.status(500).json({ message: '取得寵物資料失敗，請稍後再試' })
    }
  }

  async function createPet(req, res) {
    try {
      await attachUploadedPetAvatar(req, uploadImages)
      const petData = stripInternalPetFields(req.body)
      const pet = await petService.createPetForUser(req.userId, petData)

      return res.status(201).json({ pet })
    } catch (error) {
      console.error(error)

      if (isUniqueViolation(error)) {
        return res.status(409).json({ message: '寵物晶片號碼已被使用' })
      }

      return res.status(error.status || 500).json({
        message: error.status ? error.message : '建立寵物失敗，請稍後再試',
      })
    }
  }

  async function updatePet(req, res) {
    const id = parsePetId(req.params.id)

    if (!id) {
      return res.status(400).json({ message: '寵物 ID 格式不正確' })
    }

    try {
      if (hasUploadedFiles(req)) {
        const existingPet = await petService.findPetByIdAndUserId(id, req.userId)
        if (!existingPet) {
          return res.status(404).json({ message: '找不到寵物' })
        }
      }

      await attachUploadedPetAvatar(req, uploadImages)
      const petData = stripInternalPetFields(req.body)
      if (Object.keys(petData).length === 0) {
        return res.status(400).json({ message: '請至少提供一個寵物欄位' })
      }

      const pet = await petService.updatePetByIdAndUserId(id, req.userId, petData)

      if (!pet) {
        return res.status(404).json({ message: '找不到寵物' })
      }

      return res.status(200).json({ pet })
    } catch (error) {
      console.error(error)

      if (isUniqueViolation(error)) {
        return res.status(409).json({ message: '寵物晶片號碼已被使用' })
      }

      return res.status(error.status || 500).json({
        message: error.status ? error.message : '更新寵物失敗，請稍後再試',
      })
    }
  }

  async function deletePet(req, res) {
    const id = parsePetId(req.params.id)

    if (!id) {
      return res.status(400).json({ message: '寵物 ID 格式不正確' })
    }

    try {
      // CASCADE 會連帶刪掉行程，google_event_id 要在刪除前先收集
      const googleEventIds = await getGoogleEventIdsByPetId(id, req.userId)

      const deleted = await petService.deletePetByIdAndUserId(id, req.userId)

      if (!deleted) {
        return res.status(404).json({ message: '找不到寵物' })
      }

      await syncDeletedEvents(req.userId, googleEventIds)

      return res.status(204).send()
    } catch (error) {
      console.error(error)

      return res.status(500).json({ message: '刪除寵物失敗，請稍後再試' })
    }
  }

  return {
    listPets,
    getPet,
    createPet,
    updatePet,
    deletePet,
  }
}

export const { listPets, getPet, createPet, updatePet, deletePet } =
  createPetController(defaultPetService)
