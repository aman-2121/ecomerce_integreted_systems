import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface PaymentMethod {
  id: number;
  type: 'card' | 'bank' | 'mobile';
  provider: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/payments/methods`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.paymentMethods;
};

export const addPaymentMethod = async (data: {
  type: string;
  provider: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  chapaToken?: string;
}): Promise<PaymentMethod> => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_BASE_URL}/payments/methods`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.paymentMethod;
};

export const updatePaymentMethod = async (id: number, data: { isDefault: boolean }): Promise<PaymentMethod> => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/payments/methods/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.paymentMethod;
};

export const deletePaymentMethod = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.delete(`${API_BASE_URL}/payments/methods/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
