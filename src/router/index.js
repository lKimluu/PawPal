import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useSidebarStore } from '@/stores/sidebar.js'
import Login from '@/views/LoginView.vue'
import Register from '@/views/RegisterView.vue'
import ForgotPassword from '@/views/ForgotPasswordView.vue'
import Home from '@/views/HomeView.vue'
import Medical from '@/views/MedicalView.vue'
import Dashboard from '@/views/DashboardView.vue'
import Growth from '@/views/GrowthView.vue'
import BaseModalPreview from '@/views/BaseModalPreviewView.vue'
import Hospital from '@/views/HospitalView.vue'
import NotFound from '@/views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPassword,
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/medical',
      name: 'Medical',
      component: Medical,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/growth',
      name: 'Growth',
      component: Growth,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/base-modal-preview',
      name: 'BaseModalPreview',
      component: BaseModalPreview,
    },
    {
      path: '/hospital',
      name: 'Hospital',
      component: Hospital,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return '/login'
  }

  if (to.meta.guestOnly && authStore.isLoggedIn) {
    return '/dashboard'
  }
})

router.afterEach(() => {
  const sidebarStore = useSidebarStore()
  sidebarStore.closeSidebar()
})

export default router
