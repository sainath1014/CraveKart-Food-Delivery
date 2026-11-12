import axios from 'axios';

// Ensure guest session key exists
let guestSessionKey = localStorage.getItem('cravekart_session_key');
if (!guestSessionKey) {
  guestSessionKey = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  localStorage.setItem('cravekart_session_key', guestSessionKey);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://cravekart-backend-hmiq.onrender.com/api'),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const FOOD_CACHE_PREFIX = 'cravekart_foods_cache_v1_';
const FOOD_CACHE_TTL_MS = 5 * 60 * 1000; // Fresh for 5 minutes
const FOOD_CACHE_MAX_STALE_MS = 24 * 60 * 60 * 1000; // Usable as stale-while-revalidate up to 24 hours
const memoryFoodCache = new Map();
const inFlightFoodRequests = new Map();

const getCacheKey = (category) => `${FOOD_CACHE_PREFIX}${(category || 'all').toLowerCase()}`;

export const getCachedFoods = (category) => {
  const key = getCacheKey(category);
  const now = Date.now();
  let entry = memoryFoodCache.get(key);

  if (!entry) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.foods) && typeof parsed.timestamp === 'number') {
          entry = parsed;
          memoryFoodCache.set(key, entry);
        }
      }
    } catch {
      // Ignore storage/parse errors cleanly
    }
  }

  if (!entry) return null;

  const age = now - entry.timestamp;
  if (age > FOOD_CACHE_MAX_STALE_MS) {
    return null;
  }

  return {
    foods: entry.foods,
    timestamp: entry.timestamp,
    isFresh: age <= FOOD_CACHE_TTL_MS,
  };
};

const setCachedFoods = (category, foods) => {
  const key = getCacheKey(category);
  const entry = { foods, timestamp: Date.now() };
  memoryFoodCache.set(key, entry);
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
};

export const invalidateFoodCache = () => {
  memoryFoodCache.clear();
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(FOOD_CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
};

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
  getFoods: (category, options = {}) => {
    const { force = false } = options;
    const cacheKey = getCacheKey(category);

    if (!force) {
      const cached = getCachedFoods(category);
      if (cached && cached.isFresh) {
        return Promise.resolve({
          data: {
            success: true,
            count: cached.foods.length,
            foods: cached.foods,
            fromCache: true,
          },
        });
      }
    }

    if (!force && inFlightFoodRequests.has(cacheKey)) {
      return inFlightFoodRequests.get(cacheKey);
    }

    const requestPromise = api
      .get('/food/list/', { params: category ? { category } : {} })
      .then((res) => {
        if (res.data && Array.isArray(res.data.foods)) {
          setCachedFoods(category, res.data.foods);
        }
        return res;
      })
      .finally(() => {
        if (inFlightFoodRequests.get(cacheKey) === requestPromise) {
          inFlightFoodRequests.delete(cacheKey);
        }
      });

    inFlightFoodRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },
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
  addFood: async (formData) => {
    const res = await api.post('/admin/food/add/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    invalidateFoodCache();
    return res;
  },
  updateFood: async (id, formData) => {
    const res = await api.put(`/admin/food/update/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    invalidateFoodCache();
    return res;
  },
  deleteFood: async (id) => {
    const res = await api.delete(`/admin/food/delete/${id}/`);
    invalidateFoodCache();
    return res;
  },
  getOrders: () => api.get('/admin/orders/'),
  updateOrderStatus: (id, order_status, payment_status) =>
    api.patch(`/admin/order/status/${id}/`, { order_status, payment_status }),
};

export default api;
