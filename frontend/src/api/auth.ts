import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  googleLogin: (data: { token: string }) =>
    api.post('/auth/google', data),

  register: (userData: { name: string; email: string; password: string }) =>
    api.post('/auth/register', userData),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (profileData: { name: string; phone: string; address: string }) =>
    api.put('/auth/profile', profileData),
};

export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getAllProducts: () => api.get('/admin/products'),
  createProduct: (data: any) => api.post('/admin/products', data),
  updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  getAllOrders: () => api.get('/orders'),
  updateOrderStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
  getAllUsers: () => api.get('/admin/users'),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  // Category management
  getAllCategories: () => api.get('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
};

export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) => 
    api.put(`/orders/${id}/status`, { status }),
};

export const paymentAPI = {
  initiate: (data: { orderId: number; amount: number; email: string }) => api.post('/payments/initiate', data),
  getStatus: (orderId: string) => api.get(`/payments/status/${orderId}`),
};

export default api;