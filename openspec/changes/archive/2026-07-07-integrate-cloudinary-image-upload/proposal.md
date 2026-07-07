## Why

PawPal 目前只能接收前端提供的圖片 URL，無法讓使用者直接從前端上傳寵物照片或醫療紀錄圖片。後端需要接收 multipart 圖片、上傳到 Cloudinary，並把 Cloudinary 回傳的安全 URL 寫入既有 PostgreSQL 欄位，讓圖片資料可以穩定被前端顯示與保存。

## What Changes

- 新增後端 Cloudinary 圖片上傳能力，支援將 multipart 圖片轉成 Cloudinary secure URL。
- 讓寵物建立與更新 API 可接收單張寵物照片，並存入 pets.avatar_url。
- 讓醫療紀錄建立與更新 API 可接收多張醫療圖片，並存入 medical_records.image_url。
- 讓前端寵物新增與醫療紀錄新增/編輯在有圖片檔案時改送 multipart/form-data，欄位分別為 avatar 與 images。
- 移除前端 Supabase Storage client 與 @supabase/supabase-js 依賴，圖片上傳統一交由後端 Cloudinary 流程處理。
- 醫療紀錄 multipart 更新若同時帶既有 image_url 與新 images，後端會合併既有 URL 與新 Cloudinary URL 後保存。
- 保留既有 JSON URL 流程；前端若仍傳 avatar_url 或 image_url，後端仍照既有 schema 驗證與資料庫寫入。
- 新增 Cloudinary 與 multipart 上傳相關環境變數、依賴，以及前後端測試。

## Capabilities

### New Capabilities

- `backend-image-upload`: 前端以 multipart 傳送圖片檔案，後端接收授權使用者上傳的圖片，將圖片上傳至 Cloudinary，並把回傳 URL 寫入寵物與醫療紀錄資料。

### Modified Capabilities

(none)

## Impact

- Affected specs: backend-image-upload
- Affected code:
  - New: backend/src/config/cloudinary.js, backend/src/middlewares/upload_image.js, backend/src/services/image_upload.service.js, backend/test/image_upload.service.test.js, backend/test/upload_image.middleware.test.js
  - Modified: backend/package.json, backend/package-lock.json, backend/.env.example, backend/src/routes/pets.route.js, backend/src/routes/medical_records.route.js, backend/src/controllers/pets.controller.js, backend/src/controllers/medical_records.controller.js, backend/src/schemas/pets.schema.js, backend/src/schemas/medical_records.schema.js, backend/test/pets.route.test.js, backend/test/pets.controller.test.js, backend/test/medical_records.route.test.js, backend/test/medical_records.controller.test.js, package.json, package-lock.json, src/api/medical.js, src/api/pet.js, src/components/medical/MedicalRecordModal.vue, src/components/pet/AddPetModal.vue, src/stores/medical.js, src/test/petApi.test.js
  - New: src/test/medicalApi.test.js
  - Removed: src/utils/supabase.js
