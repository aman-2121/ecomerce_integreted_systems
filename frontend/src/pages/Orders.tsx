import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface Order {
  id: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: string;
  createdAt: string;
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'badge-success';
      case 'shipped': return 'badge-info';
      case 'confirmed': return 'badge-warning';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'failed': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleReorder = async (orderId: number) => {
    try {
      const response = await orderAPI.getById(orderId.toString());
      const order = response.data.order;

      if (order && order.orderItems) {
        for (const item of order.orderItems) {
          addToCart({
            productId: item.product.id,
            name: item.product.name,
            price: parseFloat(item.price),
            quantity: item.quantity,
            image: item.product.image || '/api/placeholder/100/100',
            stock: 999 // Assume sufficient stock for reorder
          });
        }
      }

      // Redirect to cart page
      window.location.href = '/cart';
    } catch (error) {
      console.error('Error reordering:', error);
      alert('Failed to reorder items. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">Please log in to view your orders</div>
        <Link to="/login" className="btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={fetchOrders} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        <div className="text-gray-600 dark:text-gray-300">
          {orders.length} order{orders.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">You haven't placed any orders yet</div>
          <Link to="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="card hover:shadow-lg transition-shadow duration-300">
              <div className="card-body">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3 lg:space-y-2">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Order #{order.id.toString().padStart(6, '0')}
                      </h3>
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className={`badge ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>Placed on {formatDate(order.createdAt)}</p>
                      <p>Shipping to: {order.shippingAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 mt-4 lg:mt-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {(Number(order.totalAmount) || 0).toFixed(2)} Birr
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Amount</p>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/orders/${order.id}`}
                        className="btn-outline text-sm"
                      >
                        View Details
                      </Link>
                      {order.status === 'delivered' && (
                        <button
                          className="btn-primary text-sm"
                          onClick={() => handleReorder(order.id)}
                        >
                          Reorder
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Progress */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className={`text-center ${order.status !== 'pending' ? 'text-blue-600 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                      <div className="w-3 h-3 bg-blue-600 rounded-full mx-auto mb-1"></div>
                      <span>Ordered</span>
                    </div>

                    <div className={`flex-1 h-1 ${order.status !== 'pending' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

                    <div className={`text-center ${['confirmed', 'shipped', 'delivered'].includes(order.status) ? 'text-blue-600 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        ['confirmed', 'shipped', 'delivered'].includes(order.status) ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}></div>
                      <span>Confirmed</span>
                    </div>

                    <div className={`flex-1 h-1 ${['shipped', 'delivered'].includes(order.status) ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

                    <div className={`text-center ${['shipped', 'delivered'].includes(order.status) ? 'text-blue-600 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        ['shipped', 'delivered'].includes(order.status) ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}></div>
                      <span>Shipped</span>
                    </div>

                    <div className={`flex-1 h-1 ${order.status === 'delivered' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

                    <div className={`text-center ${order.status === 'delivered' ? 'text-blue-600 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        order.status === 'delivered' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}></div>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;