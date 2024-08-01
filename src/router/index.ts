import { createRouter, createWebHistory } from 'vue-router'
import Map from '../views/HomeView.vue'
import Table from '../views/AboutView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkExactActiveClass: 'border-indigo-700',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Map
    },
    {
      path: '/table',
      name: 'table',
      component: Table
    }
  ]
})

export default router
