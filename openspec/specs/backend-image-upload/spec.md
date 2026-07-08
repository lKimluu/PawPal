# backend-image-upload Specification

## Purpose

TBD - created by archiving change 'integrate-cloudinary-image-upload'. Update Purpose after archive.

## Requirements

### Requirement: Authorized image upload to Cloudinary

The backend SHALL accept image files from authenticated requests for supported pet and medical record endpoints, upload accepted files to Cloudinary, and use the returned secure URLs as persisted image values.

#### Scenario: Upload pet avatar through pet create

- **WHEN** an authenticated user sends POST /api/v1/pets as multipart/form-data with required pet fields and one image file in the avatar field
- **THEN** the backend uploads the file to Cloudinary and stores the returned secure URL in pets.avatar_url for the created pet

#### Scenario: Upload pet avatar through pet update

- **WHEN** an authenticated user sends PATCH /api/v1/pets/:id as multipart/form-data with one image file in the avatar field for a pet owned by that user
- **THEN** the backend uploads the file to Cloudinary and updates pets.avatar_url to the returned secure URL

#### Scenario: Upload medical record images through medical record create

- **WHEN** an authenticated user sends POST /api/v1/medical-records as multipart/form-data with required medical record fields and image files in the images field for a pet owned by that user
- **THEN** the backend uploads every accepted file to Cloudinary and stores the returned secure URLs in medical_records.image_url for the created record

#### Scenario: Upload medical record images through medical record update

- **WHEN** an authenticated user sends PATCH /api/v1/medical-records/:id as multipart/form-data with image files in the images field for a record owned by that user
- **THEN** the backend uploads every accepted file to Cloudinary and persists the returned secure URL array in medical_records.image_url

#### Scenario: Merge existing medical image URLs with uploaded images

- **WHEN** an authenticated user sends PATCH /api/v1/medical-records/:id as multipart/form-data with existing image_url fields and new image files in the images field for a record owned by that user
- **THEN** the backend uploads every accepted file to Cloudinary and stores medical_records.image_url as the existing URL values followed by the new secure URLs


<!-- @trace
source: integrate-cloudinary-image-upload
updated: 2026-07-07
code:
  - src/stores/medical.js
  - backend/src/controllers/medical_records.controller.js
  - backend/src/services/image_upload.service.js
  - backend/src/middlewares/upload_image.js
  - backend/src/schemas/medical_records.schema.js
  - src/components/medical/MedicalRecordModal.vue
  - src/api/medical.js
  - src/components/pet/AddPetModal.vue
  - backend/src/controllers/pets.controller.js
  - backend/.env.example
  - backend/package.json
  - src/utils/supabase.js
  - backend/src/routes/pets.route.js
  - src/api/pet.js
  - backend/src/routes/medical_records.route.js
  - package.json
  - backend/src/config/cloudinary.js
  - backend/src/schemas/pets.schema.js
tests:
  - backend/test/image_upload.service.test.js
  - backend/test/medical_records.route.test.js
  - src/test/medicalApi.test.js
  - src/test/petApi.test.js
  - backend/test/pets.route.test.js
  - backend/test/medical_records.controller.test.js
  - backend/test/upload_image.middleware.test.js
  - backend/test/pets.controller.test.js
-->

---
### Requirement: Image upload validation

The backend MUST validate uploaded image files before Cloudinary upload. It SHALL accept only image/jpeg, image/png, and image/webp files, SHALL limit each file to 5 MB, SHALL accept at most one avatar file for pet endpoints, and SHALL accept at most five images files for medical record endpoints.

#### Scenario: Reject unsupported file type

- **WHEN** an authenticated request uploads a file whose MIME type is not image/jpeg, image/png, or image/webp
- **THEN** the backend responds with 400 and does not upload the file to Cloudinary

#### Scenario: Reject oversized image file

- **WHEN** an authenticated request uploads an image file larger than 5 MB
- **THEN** the backend responds with 400 and does not upload the file to Cloudinary

#### Scenario: Reject too many medical record images

- **WHEN** an authenticated request uploads more than five files in the images field for a medical record endpoint
- **THEN** the backend responds with 400 and does not upload any files to Cloudinary


<!-- @trace
source: integrate-cloudinary-image-upload
updated: 2026-07-07
code:
  - src/stores/medical.js
  - backend/src/controllers/medical_records.controller.js
  - backend/src/services/image_upload.service.js
  - backend/src/middlewares/upload_image.js
  - backend/src/schemas/medical_records.schema.js
  - src/components/medical/MedicalRecordModal.vue
  - src/api/medical.js
  - src/components/pet/AddPetModal.vue
  - backend/src/controllers/pets.controller.js
  - backend/.env.example
  - backend/package.json
  - src/utils/supabase.js
  - backend/src/routes/pets.route.js
  - src/api/pet.js
  - backend/src/routes/medical_records.route.js
  - package.json
  - backend/src/config/cloudinary.js
  - backend/src/schemas/pets.schema.js
tests:
  - backend/test/image_upload.service.test.js
  - backend/test/medical_records.route.test.js
  - src/test/medicalApi.test.js
  - src/test/petApi.test.js
  - backend/test/pets.route.test.js
  - backend/test/medical_records.controller.test.js
  - backend/test/upload_image.middleware.test.js
  - backend/test/pets.controller.test.js
-->

---
### Requirement: Existing JSON URL payload compatibility

The backend SHALL preserve existing JSON request behavior for pet and medical record image URL fields. JSON requests that provide avatar_url or image_url SHALL continue to validate URLs and persist them without requiring multipart upload.

#### Scenario: Persist existing pet avatar URL JSON payload

- **WHEN** an authenticated user sends POST /api/v1/pets or PATCH /api/v1/pets/:id as application/json with avatar_url set to a valid URL
- **THEN** the backend persists avatar_url using the existing pet validation and database write flow

#### Scenario: Persist existing medical image URL JSON payload

- **WHEN** an authenticated user sends POST /api/v1/medical-records or PATCH /api/v1/medical-records/:id as application/json with image_url set to an array of valid URLs
- **THEN** the backend persists image_url using the existing medical record validation and database write flow


<!-- @trace
source: integrate-cloudinary-image-upload
updated: 2026-07-07
code:
  - src/stores/medical.js
  - backend/src/controllers/medical_records.controller.js
  - backend/src/services/image_upload.service.js
  - backend/src/middlewares/upload_image.js
  - backend/src/schemas/medical_records.schema.js
  - src/components/medical/MedicalRecordModal.vue
  - src/api/medical.js
  - src/components/pet/AddPetModal.vue
  - backend/src/controllers/pets.controller.js
  - backend/.env.example
  - backend/package.json
  - src/utils/supabase.js
  - backend/src/routes/pets.route.js
  - src/api/pet.js
  - backend/src/routes/medical_records.route.js
  - package.json
  - backend/src/config/cloudinary.js
  - backend/src/schemas/pets.schema.js
tests:
  - backend/test/image_upload.service.test.js
  - backend/test/medical_records.route.test.js
  - src/test/medicalApi.test.js
  - src/test/petApi.test.js
  - backend/test/pets.route.test.js
  - backend/test/medical_records.controller.test.js
  - backend/test/upload_image.middleware.test.js
  - backend/test/pets.controller.test.js
-->

---
### Requirement: Frontend multipart request construction

The frontend SHALL send selected image files to the existing pet and medical record APIs using multipart/form-data. It MUST use the avatar field for pet creation images and the images field for medical record images. When no new image file is selected, the frontend SHALL keep sending the existing JSON payload.

#### Scenario: Create pet with selected avatar file

- **WHEN** a user submits the add pet form with one selected avatar file
- **THEN** the frontend sends POST /api/v1/pets as multipart/form-data with pet fields and the selected file in the avatar field

#### Scenario: Create medical record with selected image files

- **WHEN** a user submits a medical record form with selected image files
- **THEN** the frontend sends POST /api/v1/medical-records as multipart/form-data with medical record fields and selected files in the images field

#### Scenario: Preserve JSON request when no file is selected

- **WHEN** a user submits a pet or medical record form without selected image files
- **THEN** the frontend sends the existing application/json payload shape


<!-- @trace
source: integrate-cloudinary-image-upload
updated: 2026-07-07
code:
  - src/stores/medical.js
  - backend/src/controllers/medical_records.controller.js
  - backend/src/services/image_upload.service.js
  - backend/src/middlewares/upload_image.js
  - backend/src/schemas/medical_records.schema.js
  - src/components/medical/MedicalRecordModal.vue
  - src/api/medical.js
  - src/components/pet/AddPetModal.vue
  - backend/src/controllers/pets.controller.js
  - backend/.env.example
  - backend/package.json
  - src/utils/supabase.js
  - backend/src/routes/pets.route.js
  - src/api/pet.js
  - backend/src/routes/medical_records.route.js
  - package.json
  - backend/src/config/cloudinary.js
  - backend/src/schemas/pets.schema.js
tests:
  - backend/test/image_upload.service.test.js
  - backend/test/medical_records.route.test.js
  - src/test/medicalApi.test.js
  - src/test/petApi.test.js
  - backend/test/pets.route.test.js
  - backend/test/medical_records.controller.test.js
  - backend/test/upload_image.middleware.test.js
  - backend/test/pets.controller.test.js
-->

---
### Requirement: Frontend does not require Supabase

The frontend SHALL NOT import the Supabase client for image upload. It MUST NOT require VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for application startup or image submission.

#### Scenario: Application builds without Supabase client

- **WHEN** the frontend application is built without @supabase/supabase-js in package dependencies
- **THEN** the build completes without resolving any Supabase import


<!-- @trace
source: integrate-cloudinary-image-upload
updated: 2026-07-07
code:
  - src/stores/medical.js
  - backend/src/controllers/medical_records.controller.js
  - backend/src/services/image_upload.service.js
  - backend/src/middlewares/upload_image.js
  - backend/src/schemas/medical_records.schema.js
  - src/components/medical/MedicalRecordModal.vue
  - src/api/medical.js
  - src/components/pet/AddPetModal.vue
  - backend/src/controllers/pets.controller.js
  - backend/.env.example
  - backend/package.json
  - src/utils/supabase.js
  - backend/src/routes/pets.route.js
  - src/api/pet.js
  - backend/src/routes/medical_records.route.js
  - package.json
  - backend/src/config/cloudinary.js
  - backend/src/schemas/pets.schema.js
tests:
  - backend/test/image_upload.service.test.js
  - backend/test/medical_records.route.test.js
  - src/test/medicalApi.test.js
  - src/test/petApi.test.js
  - backend/test/pets.route.test.js
  - backend/test/medical_records.controller.test.js
  - backend/test/upload_image.middleware.test.js
  - backend/test/pets.controller.test.js
-->

---
### Requirement: Upload failure does not persist partial data

The backend MUST NOT create or update pet or medical record rows when Cloudinary upload fails before the database write. The backend SHALL return a server error response with a Traditional Chinese message when Cloudinary cannot produce a secure URL.

#### Scenario: Cloudinary failure before pet create database write

- **WHEN** an authenticated user sends a valid multipart pet create request and Cloudinary upload fails
- **THEN** the backend responds with an error and does not create the pet row

#### Scenario: Cloudinary failure before medical record update database write

- **WHEN** an authenticated user sends a valid multipart medical record update request and Cloudinary upload fails
- **THEN** the backend responds with an error and does not update the medical record row

<!-- @trace
source: integrate-cloudinary-image-upload
updated: 2026-07-07
code:
  - src/stores/medical.js
  - backend/src/controllers/medical_records.controller.js
  - backend/src/services/image_upload.service.js
  - backend/src/middlewares/upload_image.js
  - backend/src/schemas/medical_records.schema.js
  - src/components/medical/MedicalRecordModal.vue
  - src/api/medical.js
  - src/components/pet/AddPetModal.vue
  - backend/src/controllers/pets.controller.js
  - backend/.env.example
  - backend/package.json
  - src/utils/supabase.js
  - backend/src/routes/pets.route.js
  - src/api/pet.js
  - backend/src/routes/medical_records.route.js
  - package.json
  - backend/src/config/cloudinary.js
  - backend/src/schemas/pets.schema.js
tests:
  - backend/test/image_upload.service.test.js
  - backend/test/medical_records.route.test.js
  - src/test/medicalApi.test.js
  - src/test/petApi.test.js
  - backend/test/pets.route.test.js
  - backend/test/medical_records.controller.test.js
  - backend/test/upload_image.middleware.test.js
  - backend/test/pets.controller.test.js
-->