import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

const Cart: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { items, isLoading, removeFromCart, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const totalPrice = items.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = async () => {
    console.log('handleCheckout called - authLoading:', authLoading, 'user:', user);

    // Check if user has a valid token (more reliable than checking user state)
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'exists' : 'null');

    if (!token) {
      console.log('No token found, redirecting to login');
      // Store checkout as redirect after login since user was trying to checkout
      localStorage.setItem('redirectAfterLogin', '/checkout');
      // Navigate to login
      window.location.href = '/login';
      return;
    }

    // Verify token is still valid by making a quick API call
    try {
      console.log('Verifying token validity...');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log('Token is invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.setItem('redirectAfterLogin', '/checkout');
        window.location.href = '/login';
        return;
      }

      console.log('Token is valid, proceeding to checkout');
    } catch (error) {
      console.log('Error verifying token:', error);
      localStorage.removeItem('token');
      localStorage.setItem('redirectAfterLogin', '/checkout');
      window.location.href = '/login';
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    // Navigate to checkout
    window.location.href = '/checkout';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-3xl font-bold mb-4">Loading your cart...</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Please wait while we fetch your items.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Add some products to get started!</p>
          <Link
            to="/products"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item: CartItem) => (
                <div key={item.id} className="bg-white dark:bg-surface-dark rounded-lg shadow-md p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image ? item.image : 'https://via.placeholder.com/80x80.png?text=No+Image'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80.png?text=No+Image';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-surface-dark rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              <button
                onClick={clearCart}
                className="w-full mt-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
