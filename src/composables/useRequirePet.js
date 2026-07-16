import { useRoute, useRouter } from 'vue-router'
import { usePetStore } from '@/stores/petStore.js'
import { useToastStore } from '@/stores/toast.js'

export function useRequirePet() {
  const route = useRoute()
  const router = useRouter()
  const petStore = usePetStore()
  const toastStore = useToastStore()

  function ensurePetOrPrompt() {
    if (petStore.pets.length > 0) {
      return true
    }

    toastStore.showToast('請先新增寵物資料，才能建立這筆紀錄', 'error')

    if (route.name !== 'Dashboard') {
      router.push('/dashboard')
    }

    return false
  }

  return { ensurePetOrPrompt }
}
