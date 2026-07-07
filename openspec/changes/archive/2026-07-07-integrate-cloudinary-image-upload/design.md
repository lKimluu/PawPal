## Context

目前後端 pets 與 medical_records 已有可保存圖片 URL 的資料欄位：pets.avatar_url 與 medical_records.image_url。API 目前以 JSON body 和 Zod schema 驗證為主，medical_records 前端已存在圖片選取 UI，但後端沒有 multipart 解析、Cloudinary 上傳或檔案驗證能力。

本 change 會引入 Cloudinary 與 multer，讓既有資料 API 可以同時支援 JSON URL payload 與 multipart 圖片檔 payload。前端圖片檔案改由 API layer 送到後端，不再透過 Supabase Storage 直傳。資料庫 schema 不需要新增欄位。

## Goals / Non-Goals

**Goals:**

- 寵物建立與更新 API 可接收 avatar 單張圖片並存成 pets.avatar_url。
- 醫療紀錄建立與更新 API 可接收 images 多張圖片並存成 medical_records.image_url。
- 保留既有 JSON URL payload 行為，不強迫前端一次改完所有呼叫端。
- 前端有圖片檔案時建立 FormData 並送 avatar 或 images 欄位，無檔案時維持 JSON payload。
- 移除前端 Supabase Storage client 與 @supabase/supabase-js dependency，避免缺 VITE_SUPABASE_* 時 app 初始化失敗。
- 將 Cloudinary 設定、檔案驗證與上傳行為集中在 config、middleware、service，維持既有 route、controller、service 分層。

**Non-Goals:**

- 不新增 PATCH /api/v1/users/me，因此 users.avatar_url 本期不更新。
- 不在本期刪除或覆蓋 Cloudinary 舊圖資產；資料庫只保存最新 URL。
- 不新增共用 /api/v1/uploads/images 端點；本期由資料 API 直接接收 multipart 並寫入資料表。
- 不改動資料庫 schema 或 seeds 的圖片欄位型別。

## Decisions

### 使用資料 API 直接處理 multipart 圖片

寵物與醫療紀錄的 create/update endpoint 直接支援 multipart/form-data。這符合目前需求「前端傳圖片，後端變網址，再打到資料庫」，也避免前端先呼叫上傳 API、再呼叫資料 API 的兩段式流程。

替代方案是新增共用 uploads endpoint。該方案較解耦，但本期會增加前端流程複雜度，且無法在同一次資料變更中保證圖片 URL 與資料寫入一起成功或一起失敗。

### 在 route 階段解析 multipart，再交給既有 schema 驗證

route 先依 endpoint 套用 multer middleware。middleware 將 multipart text fields 正規化成 req.body 可被既有 Zod schema 接收的型別，例如 pet_id 轉 number、weight 轉 number、neutered 轉 boolean、image_url 轉 URL 陣列。Cloudinary 上傳成功後，middleware 或上傳處理器把 secure URL 寫回 req.body.avatar_url 或 req.body.image_url，再進入既有 validate middleware 與 controller。醫療紀錄 multipart request 若同時帶既有 image_url 與新 images，後端會將既有 URL 與新 Cloudinary URL 合併成同一個 image_url 陣列，避免編輯時清掉舊圖。

這個順序讓 controller 繼續只處理 request/response，service 繼續只處理資料查詢與商業邏輯，避免 SQL 或檔案處理散落到 controller。

### 使用 Cloudinary service 包裝外部 SDK

新增 image upload service 包裝 Cloudinary uploader，對內只回傳 secure_url 字串或字串陣列。Cloudinary credential 從 backend/.env 讀取，設定集中在 backend/src/config/cloudinary.js。

若 Cloudinary 未回傳 secure_url 或 SDK 拋錯，service 拋出帶狀態碼的錯誤；route/controller 回傳繁中錯誤訊息，且不呼叫資料 service 寫入資料庫。

### 檔案限制固定在後端

後端限制 MIME type 為 image/jpeg、image/png、image/webp，單檔最大 5 MB。pet endpoint 只接受 avatar 欄位一張圖；medical record endpoint 只接受 images 欄位最多五張圖。

限制放在後端是安全邊界；前端提示或 accept 屬性只能作為體驗優化，不作為信任來源。

### 前端 API layer 負責 FormData 組裝

MedicalRecordModal 僅保存使用者選取的 File 物件與本機預覽 URL，不直接呼叫任何 storage SDK。medical store 將 rawFiles 交給 src/api/medical.js；API layer 在 rawFiles 非空時建立 FormData，append 一般欄位、既有 image_url URL、以及 images 檔案。rawFiles 為空時仍送 JSON。

AddPetModal 僅允許單張寵物大頭貼檔案，submit payload 帶 avatarFile。src/api/pet.js 在有 avatarFile 時建立 FormData 並 append avatar；沒有 avatarFile 時維持既有 JSON avatar_url 流程。

### 移除前端 Supabase dependency

前端已不再使用 Supabase Storage 上傳醫療圖片，因此刪除 src/utils/supabase.js 並從 root package.json/package-lock.json 移除 @supabase/supabase-js。Cloudinary credentials 僅存在後端環境變數，前端不新增 VITE_SUPABASE_* 或 Cloudinary secret。

## Implementation Contract

- Behavior: authenticated callers can send multipart/form-data to existing pet and medical record create/update endpoints. Successful image uploads are persisted as Cloudinary secure URLs in the existing avatar_url or image_url response data. Frontend callers automatically choose multipart only when a user selected image files.
- Interface: pet endpoints accept file field avatar with max one file. Medical record endpoints accept file field images with max five files. JSON requests using avatar_url or image_url remain supported with the same response shapes as before. Medical record multipart requests may include existing image_url fields, which are merged with uploaded images.
- Failure modes: invalid MIME type, oversized file, and too many files return 400 before Cloudinary upload. Cloudinary upload failure returns a server error response with a Traditional Chinese message and does not create or update the target row. Existing auth and ownership failures keep their current status codes and messages.
- Acceptance criteria: backend tests cover middleware validation, successful Cloudinary URL injection, JSON compatibility, URL merge behavior, and Cloudinary failure preventing database writes. Frontend tests cover FormData selection and Supabase removal. Running cd backend then npm test and npm run build must pass.
- Scope boundaries: implementation is limited to upload support for pet creation and medical_records create/update. Users profile update, pet edit UI upload, Cloudinary asset deletion, and database schema changes are out of scope.

## Risks / Trade-offs

- [Risk] Multipart text fields arrive as strings and can fail existing Zod number or boolean validation. → Normalize known fields before validate middleware and cover pet_id, weight, neutered, and image_url with tests.
- [Risk] Uploading files before ownership checks can upload images for unauthorized requests. → Keep authentication before upload, and for endpoints requiring pet or record ownership, perform ownership validation before persistent database write; if ownership-first upload avoidance becomes necessary, move upload execution after controller ownership checks in a follow-up refactor.
- [Risk] Cloudinary assets can become orphaned if upload succeeds but database write later fails. → Accept this limitation for v1 and document that automated Cloudinary cleanup is out of scope.
- [Risk] New dependencies can affect backend install and CI. → Update backend/package-lock.json and verify with backend npm test.
- [Risk] Frontend may accidentally send multipart without files and bypass existing JSON tests. → API helpers choose FormData only when rawFiles or avatarFile exists, and frontend tests assert both multipart and JSON paths.
- [Risk] Removing Supabase could break hidden imports. → Search the frontend for supabase, @supabase/supabase-js, and VITE_SUPABASE, then verify npm run build.
