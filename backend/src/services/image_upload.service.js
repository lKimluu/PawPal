import { cloudinaryUploader, getCloudinaryFolder } from '../config/cloudinary.js'

const DEFAULT_UPLOAD_ERROR_MESSAGE = '圖片上傳失敗，請稍後再試'

function createUploadError() {
  const error = new Error(DEFAULT_UPLOAD_ERROR_MESSAGE)
  error.status = 502
  return error
}

export function createImageUploadService({
  uploader = cloudinaryUploader,
  folder = getCloudinaryFolder(),
} = {}) {
  async function uploadImage(file) {
    if (!file?.buffer) {
      throw createUploadError()
    }

    return new Promise((resolve, reject) => {
      try {
        const uploadStream = uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result?.secure_url) {
              reject(createUploadError())
              return
            }

            resolve(result.secure_url)
          },
        )

        uploadStream.end(file.buffer)
      } catch {
        reject(createUploadError())
      }
    })
  }

  async function uploadImages(files = []) {
    return Promise.all(files.map((file) => uploadImage(file)))
  }

  return {
    uploadImage,
    uploadImages,
  }
}

export const { uploadImage, uploadImages } = createImageUploadService()
