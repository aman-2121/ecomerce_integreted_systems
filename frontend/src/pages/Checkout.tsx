import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, paymentAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface CheckoutForm {
  shippingAddress: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  paymentMethod: 'telebirr';
}

const Checkout: React.FC = () => {
  const { user } = useAuth();
  const { items: cartItems, getTotal } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CheckoutForm>({
    shippingAddress: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
    paymentMethod: 'telebirr'
  });

  // Calculate totals
  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Transform cart items to match API format
      const orderItems = cartItems.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price
      }));

      // Create order
      const orderResponse = await orderAPI.create({
        items: orderItems,
        shippingAddress: `${formData.shippingAddress}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        totalAmount: total
      });

      const orderId = orderResponse.data.order.id;

      // Initiate payment
      const paymentResponse = await paymentAPI.initiate({ orderId });

      // Redirect to Telebirr payment page
      window.location.href = paymentResponse.data.paymentUrl;

    } catch (err: any) {
      setError(err.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Information */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shipping Information</h2>
              </div>
              
              <div className="card-body space-y-4">
                <div className="form-group">
                  <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Shipping Address
                  </label>
                  <input
                    type="text"
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter your shipping address"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="City"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Postal Code"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Country"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Method</h2>
              </div>

              <div className="card-body">
                <div className="flex items-center space-x-3 p-4 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <input
                    type="radio"
                    id="telebirr"
                    name="paymentMethod"
                    value="telebirr"
                    checked={formData.paymentMethod === 'telebirr'}
                    onChange={handleChange}
                    className="text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <label htmlFor="telebirr" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Telebirr</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                  You will be redirected to Telebirr to complete your payment securely.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="card sticky top-4">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Order Summary</h2>
              </div>

              <div className="card-body space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartItems.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-300">Your cart is empty</p>
                  ) : (
                    cartItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Pricing */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                    <span className="font-medium text-gray-900 dark:text-white">${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tax</span>
                    <span className="font-medium text-gray-900 dark:text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay with Telebirr - $${total.toFixed(2)}`
                  )}
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                  By completing your purchase, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;