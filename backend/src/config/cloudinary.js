import { v2 as cloudinary } from 'cloudinary'

export function createCloudinaryConfigFromEnv(env = process.env) {
  return {
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  }
}

cloudinary.config(createCloudinaryConfigFromEnv())

export const cloudinaryUploader = cloudinary.uploader

export function getCloudinaryFolder(env = process.env) {
  return env.CLOUDINARY_FOLDER || 'pawpal'
}
