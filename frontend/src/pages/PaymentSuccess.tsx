import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing your payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        
        <p className="text-gray-600 mb-6 text-lg">
          Thank you for your purchase. Your order has been confirmed and will be shipped soon.
        </p>

        {orderId && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 inline-block">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="font-mono font-bold text-gray-900">{orderId}</p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-gray-600">
            A confirmation email has been sent to your email address.
          </p>
          
          <div className="flex justify-center space-x-4 pt-6">
            <Link to="/orders" className="btn-primary">
              View Orders
            </Link>
            <Link to="/products" className="btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="mt-12 text-left">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">What's Next?</h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-blue-600 font-bold text-sm">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Order Confirmed</h3>
              <p className="text-gray-600">Your order has been confirmed and is being processed.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-gray-600 font-bold text-sm">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Shipping</h3>
              <p className="text-gray-600">Your order will be shipped within 1-2 business days.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-gray-600 font-bold text-sm">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Delivery</h3>
              <p className="text-gray-600">Expected delivery: 3-5 business days after shipping.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;