import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const getProducts = async (categoryId?: number): Promise<Product[]> => {
  const params = categoryId ? { categoryId } : {};
  const response = await axios.get(`${API_BASE_URL}/products`, { params });
  return response.data.products;
};

export const getProduct = async (id: number): Promise<Product> => {
  const response = await axios.get(`${API_BASE_URL}/products/${id}`);
  return response.data.product;
};

export const createProduct = async (data: FormData): Promise<Product> => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_BASE_URL}/products`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.product;
};

export const updateProduct = async (id: number, data: FormData): Promise<Product> => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/products/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.product;
};

export const deleteProduct = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.delete(`${API_BASE_URL}/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
