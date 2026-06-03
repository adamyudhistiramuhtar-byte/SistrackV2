import { createRouter, createWebHistory } from 'vue-router';

import SeatSelect from '../pages/customer/SeatSelect.vue';
import Menu from '../pages/customer/Menu.vue';
import Checkout from '../pages/customer/Checkout.vue';

import AdminLogin from '../pages/admin/Login.vue';
import AdminDashboard from '../pages/admin/Dashboard.vue';

const routes = [
  { path: '/', redirect: '/seat' },

  // CUSTOMER
  { path: '/seat', component: SeatSelect },
  { path: '/menu', component: Menu, meta: { requiresSeat: true } },
  { path: '/checkout', component: Checkout, meta: { requiresSeat: true } },

  // ADMIN
  { path: '/admin', redirect: '/admin/login' },
  { path: '/admin/login', component: AdminLogin },
  { path: '/admin/dashboard', component: AdminDashboard, meta: { requiresAdmin: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresSeat) {
    const seat = localStorage.getItem('seatNumber');
    if (!seat) return next('/seat');
  }

  if (to.meta.requiresAdmin) {
    const token = localStorage.getItem('adminToken');
    if (!token) return next('/admin/login');
  }

  next();
});

export default router;
