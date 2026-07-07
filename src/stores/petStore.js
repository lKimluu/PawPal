import { ref } from 'vue'
import { defineStore } from 'pinia'
import { medicalApi } from '@/api/medical.js'
import defaultPetAvatar from '@/assets/images/pet_default.png'

export const usePetStore = defineStore('pet', () => {
  const pets = ref([])

  async function fetchUserPets() {
    try {
      const res = await medicalApi.getUserPets()
      const serverPets = res.data?.pets || []

      pets.value = serverPets.map((pet) => ({
        id: Number(pet.id),
        name: pet.name,
        photoUrl: pet.photo_url || pet.avatar_url || defaultPetAvatar,
      }))

      return { success: true }
    } catch (error) {
      console.error('取得寵物資料失敗:', error)
      pets.value = []

      return {
        success: false,
        message: error.response?.data?.message || '取得寵物資料失敗',
      }
    }
  }

  return { pets, fetchUserPets }
})
