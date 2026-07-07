## 1. 依賴與 Cloudinary 基礎建設

- [x] 1.1 安裝 cloudinary 與 multer，讓 backend/package.json 與 backend/package-lock.json 可供後端載入 Cloudinary SDK 與 multipart parser；以 cd backend && npm test 驗證依賴不破壞現有測試啟動。
- [x] 1.2 建立 backend/src/config/cloudinary.js 與 backend/.env.example 設定，讓 CLOUDINARY_CLOUD_NAME、CLOUDINARY_API_KEY、CLOUDINARY_API_SECRET、CLOUDINARY_FOLDER 可被後端讀取；以手動檢查 .env.example 與 node import 驗證設定名稱一致。
- [x] 1.3 實作 使用 Cloudinary service 包裝外部 SDK 的 image_upload service，讓單張與多張上傳成功時回傳 secure URL，Cloudinary 未回傳 secure_url 或拋錯時丟出可被 controller/middleware 轉成繁中錯誤回應的錯誤；以 backend/test/image_upload.service.test.js 驗證成功與失敗路徑。

## 2. Multipart middleware 與驗證

- [x] 2.1 實作 檔案限制固定在後端 的 upload_image middleware，讓 pet avatar 僅接受 1 張、medical images 僅接受最多 5 張，且只接受 image/jpeg、image/png、image/webp 與單檔最大 5 MB；以 backend/test/upload_image.middleware.test.js 驗證 Image upload validation 的拒絕行為。
- [x] 2.2 實作 在 route 階段解析 multipart，再交給既有 schema 驗證 的欄位正規化，讓 multipart 文字欄位中的 pet_id、weight、neutered 與 image_url 轉成既有 Zod schema 可接受的型別；以 route 或 schema 測試驗證 multipart 表單欄位能通過既有 create/update 驗證。
- [x] 2.3 保留 Existing JSON URL payload compatibility，讓 application/json 的 avatar_url 與 image_url 請求仍走既有 validate middleware 與 database write flow；以 pets 與 medical_records 既有 JSON route/controller 測試驗證回歸。

## 3. 寵物與醫療紀錄 API 串接

- [x] 3.1 在 使用資料 API 直接處理 multipart 圖片 的 pet create/update routes 串接 authenticateToken、multipart upload、Cloudinary 上傳、validate、controller 順序，讓 POST /api/v1/pets 與 PATCH /api/v1/pets/:id 可用 avatar 檔案寫入 pets.avatar_url；以 pets route/controller 測試驗證 Authorized image upload to Cloudinary 的寵物建立與更新情境。
- [x] 3.2 在 使用資料 API 直接處理 multipart 圖片 的 medical record create/update routes 串接 authenticateToken、multipart upload、Cloudinary 上傳、validate、controller 順序，讓 POST /api/v1/medical-records 與 PATCH /api/v1/medical-records/:id 可用 images 檔案寫入 medical_records.image_url；以 medical_records route/controller 測試驗證 Authorized image upload to Cloudinary 的醫療紀錄建立與更新情境。
- [x] 3.3 實作 Upload failure does not persist partial data，讓 Cloudinary 上傳失敗時不呼叫 pet 或 medical record data service 建立/更新資料列，並回傳繁中錯誤訊息；以 controller 或 route 測試驗證資料 service mock 未被呼叫。

## 4. 驗證與收尾

- [x] 4.1 執行 cd backend && npm test，確認 Cloudinary 圖片上傳、Image upload validation、Existing JSON URL payload compatibility、Upload failure does not persist partial data 與既有後端測試全部通過。
- [x] 4.2 執行 npm run build，確認後端 API 變更不破壞前端既有 build；若前端尚未串 FormData，只驗證既有 JSON URL 與 mock data build 仍可完成。

## 5. 前端圖片上傳串接

- [x] 5.1 實作 前端 API layer 負責 FormData 組裝 與 Frontend multipart request construction，讓 src/api/medical.js 在 rawFiles 非空時送 images multipart、無檔案時維持 JSON；以 src/test/medicalApi.test.js 驗證 multipart 與 JSON 兩種路徑。
- [x] 5.2 實作 Frontend multipart request construction 的寵物新增流程，讓 AddPetModal 只提交單張 avatarFile 並由 src/api/pet.js 送 avatar multipart、無檔案時維持 JSON；以 src/test/petApi.test.js 驗證 multipart 與 JSON 兩種路徑。
- [x] 5.3 更新在 route 階段解析 multipart，再交給既有 schema 驗證 的醫療圖片合併行為，讓 multipart request 同時帶既有 image_url 與新 images 時保存合併後陣列；以 backend/test/upload_image.middleware.test.js 驗證既有 URL 後接新 Cloudinary URL。
- [x] 5.4 實作 移除前端 Supabase dependency 與 Frontend does not require Supabase，刪除 src/utils/supabase.js 並移除 @supabase/supabase-js dependency；以 rg 搜尋和 src/test/medicalApi.test.js 驗證前端 runtime code 不再引用 Supabase。
- [x] 5.5 執行 node --test src/test/petApi.test.js src/test/medicalApi.test.js、npm run build、cd backend && npm test，確認前端 FormData、Supabase 移除、後端 Cloudinary 流程與既有測試全部通過。
