import axios from 'axios';

// All API calls go through Nginx which proxies to individual services
const BASE = '';

export const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  verify: () => api.get('/api/auth/verify'),
};

// ── Users ─────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/api/users/me'),
  createProfile: (data) => api.post('/api/users/me', data),
  updateProfile: (data) => api.patch('/api/users/me', data),
  addAddress: (data) => api.post('/api/users/me/addresses', data),
  removeAddress: (id) => api.delete(`/api/users/me/addresses/${id}`),
};

// ── Products ──────────────────────────────────────
export const productAPI = {
  getProducts: (params) => api.get('/api/products', { params }),
  getProduct: (id) => api.get(`/api/products/${id}`),
  createProduct: (data) => api.post('/api/products', data),
  updateProduct: (id, data) => api.patch(`/api/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/products/${id}`),
};

// ── Orders ────────────────────────────────────────
export const orderAPI = {
  createOrder: (data) => api.post('/api/orders', data),
  getMyOrders: (params) => api.get('/api/orders/my', { params }),
  getOrder: (id) => api.get(`/api/orders/${id}`),
  cancelOrder: (id) => api.post(`/api/orders/${id}/cancel`),
  // Admin
  getAllOrders: (params) => api.get('/api/orders', { params }),
  updateOrderStatus: (id, data) => api.patch(`/api/orders/${id}/status`, data),
};
