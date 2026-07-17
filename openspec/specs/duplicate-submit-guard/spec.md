# duplicate-submit-guard Specification

## Purpose

Defines the site-wide behavior for preventing duplicate API requests when a user rapidly triggers a create, update, or delete action. Every submit or delete-confirm control SHALL disable itself and enter a loading state on first activation, block re-activation until the in-flight request resolves, and restore itself on failure — implemented via an `isLoading`/`isSubmitting` prop or local ref combined with an internal guard clause in the handler function (not the disabled attribute alone).

## Requirements

### Requirement: Shared delete confirmation modal blocks duplicate confirmation

The shared `DeleteConfirmModal` component SHALL accept an `isLoading` boolean prop (default `false`). While `isLoading` is `true`, the confirm button and the close button SHALL be disabled, and the component's internal confirm/close handlers SHALL return immediately without emitting further events.

#### Scenario: Rapid double-click on confirm button sends only one delete request

- **WHEN** a user clicks the confirm button in `DeleteConfirmModal` twice in rapid succession before the first delete request completes
- **THEN** only one delete request is emitted to the parent component/API

#### Scenario: Confirm and close buttons are disabled while deletion is in progress

- **WHEN** the parent component sets `isLoading` to `true` after the confirm button is first clicked
- **THEN** both the confirm button and the close button are rendered as disabled

#### Scenario: Loading state resets after the modal is closed

- **WHEN** the modal is closed (after a successful delete, a failed delete, or the user cancelling) and later reopened for a new delete action
- **THEN** the modal renders with `isLoading` as `false` and the confirm button enabled


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Pet deletion applies the duplicate-submit guard

`DashboardView`'s pet deletion flow SHALL pass its existing deletion-in-progress state to `DeleteConfirmModal`'s `isLoading` prop, so that confirming pet deletion is guarded against duplicate clicks.

#### Scenario: Rapid double-click on pet delete confirmation sends only one DELETE request

- **WHEN** a user opens the delete confirmation modal for a pet and clicks confirm twice in rapid succession
- **THEN** only one `DELETE` request for that pet is sent, and the pet list reflects the deletion only once the request succeeds

#### Scenario: Failed pet deletion restores the confirm button

- **WHEN** the pet deletion request fails
- **THEN** the deletion-in-progress state is reset to `false` and the confirm button becomes clickable again


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Medical record creation and update apply a submit guard

`MedicalRecordModal`'s create/update submit button SHALL accept and respect an `isLoading` boolean prop bound to the medical records store's loading state. While `isLoading` is `true`, the submit button SHALL be disabled and SHALL NOT trigger another submit.

#### Scenario: Rapid double-click on submit sends only one create request

- **WHEN** a user fills in a new medical record and clicks the submit button twice in rapid succession before the first request completes
- **THEN** only one create request is sent to the medical records API

#### Scenario: Rapid double-click on submit sends only one update request

- **WHEN** a user edits an existing medical record and clicks the save button twice in rapid succession before the first request completes
- **THEN** only one update request is sent to the medical records API

#### Scenario: Failed submit restores the submit button

- **WHEN** the create or update request fails
- **THEN** `isLoading` is reset to `false` and the submit button becomes clickable again

#### Scenario: Modal closes and updates the list only after a successful request

- **WHEN** a create or update request succeeds
- **THEN** the modal closes and the medical record list reflects the change; if the request has not yet completed, the modal SHALL remain open


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Medical record deletion applies the duplicate-submit guard

`MedicalView`'s delete confirmation flow SHALL maintain a local deletion-in-progress state and pass it to `DeleteConfirmModal`'s `isLoading` prop.

#### Scenario: Rapid double-click on medical record delete confirmation sends only one DELETE request

- **WHEN** a user opens the delete confirmation modal for a medical record and clicks confirm twice in rapid succession
- **THEN** only one `DELETE` request for that record is sent

#### Scenario: Failed medical record deletion restores the confirm button

- **WHEN** the medical record deletion request fails
- **THEN** the local deletion-in-progress state is reset to `false` and the confirm button becomes clickable again


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Growth record deletion applies the duplicate-submit guard

`GrowthView`'s delete confirmation flow SHALL maintain a local deletion-in-progress state and pass it to `DeleteConfirmModal`'s `isLoading` prop.

#### Scenario: Rapid double-click on growth record delete confirmation sends only one DELETE request

- **WHEN** a user opens the delete confirmation modal for a growth record and clicks confirm twice in rapid succession
- **THEN** only one `DELETE` request for that record is sent

#### Scenario: Failed growth record deletion restores the confirm button

- **WHEN** the growth record deletion request fails
- **THEN** the local deletion-in-progress state is reset to `false` and the confirm button becomes clickable again


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Growth record creation applies an internal submit guard

`GrowthRecordModal`'s submit handler SHALL check the `isSubmitting` prop at the start of its submit function and return immediately without emitting `submit` when it is `true`, in addition to the existing `:disabled` binding on the submit button.

#### Scenario: Rapid repeated clicks under slow network send only one create request

- **WHEN** a user fills in a new growth record and clicks the submit button multiple times in rapid succession while the network is slow, before the button has visually updated to a disabled state
- **THEN** only one create request is sent to the growth records API


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Growth record inline edit applies an internal submit guard

`GrowthHistoryModal`'s `saveEdit` function SHALL check the local `isSaving` state at its start and return immediately when it is `true`, in addition to the existing `:disabled` binding on the save button.

#### Scenario: Rapid repeated clicks on save during inline edit send only one update request

- **WHEN** a user edits a growth record value inline and clicks the save button multiple times in rapid succession
- **THEN** only one update request is sent to the growth records API


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Pet creation applies an internal submit guard

`AddPetModal`'s submit handler SHALL check the `isLoading` prop at the start of its submit function and return immediately without emitting `submit` when it is `true`, in addition to the existing `:disabled` binding on the submit button.

#### Scenario: Rapid repeated clicks under slow network send only one create request

- **WHEN** a user fills in a new pet form and clicks the submit button multiple times in rapid succession while the network is slow
- **THEN** only one create request is sent to the pets API


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Pet profile update applies an internal submit guard

`PetProfileModal`'s `handleSaveEdit` function SHALL check the `isSaving` prop at its start and return immediately when it is `true`, in addition to the existing `:disabled` binding on the save button.

#### Scenario: Rapid repeated clicks on save send only one update request

- **WHEN** a user edits a pet's profile and clicks the save button multiple times in rapid succession
- **THEN** only one update request is sent to the pets API


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Login form applies an internal submit guard

`LoginForm`'s `handleSubmit` function SHALL check the local `isSubmitting` state at its start and return immediately when it is `true`, in addition to the existing `:disabled` binding on the submit button.

#### Scenario: Rapid repeated clicks send only one login request

- **WHEN** a user clicks the login button multiple times in rapid succession
- **THEN** only one login request is sent to the authentication API


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Register form applies an internal submit guard

`RegisterForm`'s `handleSubmit` function SHALL check the local `isSubmitting` state at its start and return immediately when it is `true`, in addition to the existing `:disabled` binding on the submit button.

#### Scenario: Rapid repeated clicks send only one register request

- **WHEN** a user clicks the register button multiple times in rapid succession
- **THEN** only one register request is sent to the authentication API


<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->

---
### Requirement: Hospital review deletion applies the duplicate-submit guard

`HospitalView`'s review deletion flow SHALL maintain a local deletion-in-progress state and pass it to `DeleteConfirmModal`'s `isLoading` prop.

#### Scenario: Rapid double-click on review delete confirmation sends only one DELETE request

- **WHEN** a user opens the delete confirmation modal for a hospital review and clicks confirm twice in rapid succession
- **THEN** only one `DELETE` request for that review is sent

#### Scenario: Failed review deletion restores the confirm button

- **WHEN** the hospital review deletion request fails
- **THEN** the local deletion-in-progress state is reset to `false` and the confirm button becomes clickable again

<!-- @trace
source: prevent-duplicate-submit
updated: 2026-07-17
code:
  - backend/src/middlewares/upload_image.js
  - src/views/MedicalView.vue
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/src/services/hospitals.service.js
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/components/pet/AddPetModal.vue
  - backend/src/services/hospital_reviews.service.js
  - src/api/hospitals.js
  - src/utils/hospitalPopup.js
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/growth/GrowthRecordModal.vue
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/HospitalList.vue
  - package.json
  - src/components/medical/MedicalRecordModal.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalReviewModal.vue
  - src/assets/hospital-map.css
  - src/assets/main.css
  - src/components/auth/RegisterForm.vue
  - src/components/common/PetLoadingRunner.vue
  - src/main.js
  - src/views/GrowthView.vue
  - src/assets/icons/pet-loading.svg
  - src/components/pet/PetProfileModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/hospital.js
  - src/components/layout/AppHeader.vue
tests:
  - backend/test/hospitals.service.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalReviews.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/userProfileModal.test.js
  - src/test/petApi.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/hospitalMapSelection.test.js
-->