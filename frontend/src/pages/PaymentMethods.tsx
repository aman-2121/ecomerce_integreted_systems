import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, PaymentMethod } from '../api/payment';

const PaymentMethods: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'card',
    provider: 'chapa',
    last4: '',
    brand: '',
    expiryMonth: '',
    expiryYear: '',
    chapaToken: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPaymentMethods();
  }, [user, navigate]);

  const fetchPaymentMethods = async () => {
    try {
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPaymentMethod(formData);
      setFormData({
        type: 'card',
        provider: 'chapa',
        last4: '',
        brand: '',
        expiryMonth: '',
        expiryYear: '',
        chapaToken: ''
      });
      setShowForm(false);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to add payment method:', error);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await updatePaymentMethod(id, { isDefault: true });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to set default payment method:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await deletePaymentMethod(id);
        fetchPaymentMethods();
      } catch (error) {
        console.error('Failed to delete payment method:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payment Methods</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'Add Payment Method'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            {formData.type === 'card' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    value={formData.last4}
                    onChange={(e) => setFormData({ ...formData, last4: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Month</label>
                  <input
                    type="number"
                    value={formData.expiryMonth}
                    onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Year</label>
                  <input
                    type="number"
                    value={formData.expiryYear}
                    onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min={new Date().getFullYear()}
                  />
                </div>
              </>
            )}
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Payment Method
          </button>
        </form>
      )}

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
            <div>
              <div className="font-semibold">{method.type.toUpperCase()} - {method.provider}</div>
              {method.last4 && <div className="text-sm text-gray-600">**** **** **** {method.last4}</div>}
              {method.brand && <div className="text-sm text-gray-600">{method.brand}</div>}
              {method.isDefault && <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Default</span>}
            </div>
            <div className="space-x-2">
              {!method.isDefault && (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Set Default
                </button>
              )}
              <button
                onClick={() => handleDelete(method.id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
