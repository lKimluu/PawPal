import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useSidebarStore } from '@/stores/sidebar.js'
import Home from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterView.vue'),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/medical',
      name: 'Medical',
      component: () => import('@/views/MedicalView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/growth',
      name: 'Growth',
      component: () => import('@/views/GrowthView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/base-modal-preview',
      name: 'BaseModalPreview',
      component: () => import('@/views/BaseModalPreviewView.vue'),
    },
    {
      path: '/hospital',
      name: 'Hospital',
      component: () => import('@/views/HospitalView.vue'),
    },
    {
      path: '/privacy-policy',
      name: 'PrivacyPolicy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
    },
    {
      path: '/terms-of-service',
      name: 'TermsOfService',
      component: () => import('@/views/TermsOfServiceView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],

  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
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
