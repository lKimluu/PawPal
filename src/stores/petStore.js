import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { medicalApi } from '@/api/medical.js'
import { createPet as createPetApi, listPets as listPetsApi, updatePet as updatePetApi } from '@/api/pet.js'
import defaultPetAvatar from '@/assets/images/pet_default.png'

export const usePetStore = defineStore('pet', () => {
  const pets = ref([])
  const selectedPetId = ref(null)
  const isLoading = ref(false)
  let requestGeneration = 0

  const currentPet = computed(() => pets.value.find((p) => p.id === selectedPetId.value) ?? null)

  function isCurrentRequest(generation) {
    return generation === requestGeneration
  }

  function normalizePet(pet) {
    const photoUrl = pet.photoUrl || pet.photo_url || pet.avatar_url || pet.image

    return {
      ...pet,
      id: Number(pet.id),
      hasCustomPhoto: Boolean(photoUrl),
      photoUrl: photoUrl || defaultPetAvatar,
    }
  }

  function setPets(nextPets) {
    pets.value = nextPets.map(normalizePet)

    const hasSelectedPet = pets.value.some((pet) => pet.id === selectedPetId.value)
    if (!hasSelectedPet) {
      selectedPetId.value = pets.value[0]?.id ?? null
    }
  }

  function setSelectedPet(id) {
    selectedPetId.value = Number(id)
  }

  async function fetchUserPets() {
    const generation = requestGeneration

    try {
      const res = await medicalApi.getUserPets()
      if (!isCurrentRequest(generation)) {
        return { success: false, stale: true }
      }

      const serverPets = res.data?.pets || []

      setPets(serverPets)

      return { success: true }
    } catch (error) {
      if (!isCurrentRequest(generation)) {
        return { success: false, stale: true }
      }

      console.error('取得寵物資料失敗:', error)
      pets.value = []
      selectedPetId.value = null

      return {
        success: false,
        message: error.response?.data?.message || '取得寵物資料失敗',
      }
    }
  }

  async function fetchPets() {
    const generation = requestGeneration

    isLoading.value = true

    const result = await listPetsApi()
    if (!isCurrentRequest(generation)) {
      return { success: false, stale: true }
    }

    if (result.success) {
      setPets(result.data.pets)
    }

    if (isCurrentRequest(generation)) {
      isLoading.value = false
    }

    return result
  }

  async function createPet(payload) {
    const generation = requestGeneration
    const result = await createPetApi(payload)
    if (!isCurrentRequest(generation)) {
      return { success: false, stale: true }
    }

    if (result.success && result.data.pet) {
      const createdPet = normalizePet(result.data.pet)
      pets.value = [createdPet, ...pets.value]
      selectedPetId.value = createdPet.id
    }

    return result
  }

  async function updatePet(id, payload, token) {
    const generation = requestGeneration
    const petId = Number(id)
    const result = await updatePetApi(id, payload, token)
    if (!isCurrentRequest(generation)) {
      return { success: false, stale: true }
    }

    if (result.success) {
      const updatedPet = result.data.pet ?? { id: petId, ...payload }
      let hasUpdatedPet = false

      pets.value = pets.value.map((pet) => {
        if (pet.id !== petId) {
          return pet
        }

        hasUpdatedPet = true
        return normalizePet({ ...pet, ...updatedPet })
      })

      if (!hasUpdatedPet) {
        pets.value = [normalizePet(updatedPet), ...pets.value]
      }
    }

    return result
  }

  function reset() {
    requestGeneration += 1
    pets.value = []
    selectedPetId.value = null
    isLoading.value = false
  }

  return {
    pets,
    selectedPetId,
    currentPet,
    isLoading,
    setSelectedPet,
    fetchUserPets,
    fetchPets,
    createPet,
    updatePet,
    reset,
  }
})
