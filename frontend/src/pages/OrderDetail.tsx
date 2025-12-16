import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string;
  };
}

interface Order {
  id: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: string;
  createdAt: string;
  orderItems: OrderItem[];
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const response = await orderAPI.getById(id!);
      setOrder(response.data.order);
    } catch (err) {
      setError('Failed to fetch order details');
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
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'failed': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">Please log in to view order details</div>
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

  if (error || !order) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error || 'Order not found'}</div>
        <Link to="/orders" className="btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/orders" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          ← Back to Orders
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Order #{order.id.toString().padStart(6, '0')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <span className={`badge ${getStatusColor(order.status)} mb-2`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <br />
              <span className={`badge ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.orderItems && order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <img
                    src={item.product.image ? item.product.image : '/placeholder.png'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png';
                    }}
                  />
                  <div className="flex-1">
                    <Link
                      to={`/products/${item.product.id}`}
                      className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-gray-600 dark:text-gray-300">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(Number(item.price) * item.quantity).toFixed(2)} Birr
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {Number(item.price).toFixed(2)} Birr each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Shipping Address</h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {order.shippingAddress}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">${Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                    <span className="text-gray-900 dark:text-white">Free</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-semibold text-blue-600">${Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Progress */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Progress</h3>
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
    </div>
  );
};

export default OrderDetail;
