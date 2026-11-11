import axios from 'axios';

// Ensure guest session key exists
let guestSessionKey = localStorage.getItem('cravekart_session_key');
if (!guestSessionKey) {
  guestSessionKey = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  localStorage.setItem('cravekart_session_key', guestSessionKey);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://cravekart-backend-hmiq.onrender.com/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Check if request is under /admin/
    const isAdminReq = config.url && config.url.includes('/admin/');
    const adminToken = localStorage.getItem('cravekart_admin_token');
    const userToken = localStorage.getItem('cravekart_user_token');

    if (isAdminReq && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }

    config.headers['X-Session-Key'] = guestSessionKey;
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/user/register/', data),
  login: (data) => api.post('/user/login/', data),
  adminLogin: (data) => api.post('/admin/login/', data),
  getProfile: () => api.get('/user/profile/'),
  logout: () => api.post('/user/logout/'),
};

export const foodAPI = {
  getFoods: (category) => api.get('/food/list/', { params: category ? { category } : {} }),
  getFoodDetail: (id) => api.get(`/food/detail/${id}/`),
  searchFoods: (q) => api.get('/food/search/', { params: { q } }),
};

export const cartAPI = {
  getCart: () => api.get('/cart/'),
  addToCart: (food_id, quantity = 1) => api.post('/cart/add/', { food_id, quantity }),
  updateCart: (food_id, quantity) => api.post('/cart/update/', { food_id, quantity }),
  removeFromCart: (food_id) => api.post('/cart/remove/', { food_id }),
  clearCart: () => api.post('/cart/clear/'),
};

export const promoAPI = {
  validate: (code, subtotal) => api.post('/promo/validate/', { code, subtotal }),
};

export const orderAPI = {
  createOrder: (data) => api.post('/order/create/', data),
  verifyPayment: (data) => api.post('/payment/verify/', data),
  getUserOrders: () => api.get('/order/userorders/'),
  getOrderDetail: (id) => api.get(`/order/detail/${id}/`),
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/'),
  getFoods: () => api.get('/admin/food/list/'),
  addFood: (formData) => api.post('/admin/food/add/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateFood: (id, formData) => api.put(`/admin/food/update/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteFood: (id) => api.delete(`/admin/food/delete/${id}/`),
  getOrders: () => api.get('/admin/orders/'),
  updateOrderStatus: (id, order_status, payment_status) =>
    api.patch(`/admin/order/status/${id}/`, { order_status, payment_status }),
};

export default api;
