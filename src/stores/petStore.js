import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { pets as petsData } from '@/data/pets.js'
import { createPet as createPetApi, listPets as listPetsApi } from '@/api/pet.js'

export const usePetStore = defineStore('pet', () => {
  const pets = ref(petsData)
  const selectedPetId = ref(petsData[0]?.id ?? null)
  const isLoading = ref(false)

  const currentPet = computed(() => pets.value.find((p) => p.id === selectedPetId.value) ?? null)

  function setSelectedPet(id) {
    selectedPetId.value = id
  }

  async function fetchPets() {
    isLoading.value = true

    const result = await listPetsApi()

    if (result.success) {
      pets.value = result.data.pets
      selectedPetId.value = pets.value[0]?.id ?? null
    }

    isLoading.value = false

    return result
  }

  async function createPet(payload) {
    const result = await createPetApi(payload)

    if (result.success && result.data.pet) {
      const createdPet = result.data.pet
      pets.value = [createdPet, ...pets.value]
      selectedPetId.value = createdPet.id
    }

    return result
  }

  return { pets, selectedPetId, currentPet, isLoading, setSelectedPet, fetchPets, createPet }
})
