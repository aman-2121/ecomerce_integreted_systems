// frontend/src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  image: string | null;
  stock: number;
  salesCount?: number;
  Category?: { name: string; };
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const formatPrice = (price: any) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const handleAddToCart = () => {
    if (!user) {
      // Store current location for redirect after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      // Navigate to login
      window.location.href = '/login';
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      quantity: 1,
      image: product.image || '/api/placeholder/100/100',
      stock: product.stock
    });

    // Redirect to cart page
    window.location.href = '/cart';
  };

  const imageUrl = product.image
    ? product.image
    : 'https://via.placeholder.com/300x300.png?text=No+Image';



  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg dark:shadow-gray-800 overflow-hidden hover:shadow-2xl dark:hover:shadow-gray-700 transition-all duration-300 transform hover:-translate-y-2">
      <Link to={`/products/${product.id}`}>
        <div className="h-64 bg-gray-100 dark:bg-gray-700">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300.png?text=No+Image';
            }}
          />
        </div>
      </Link>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
          {product.name}
        </h3>

        {product.Category?.name && (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-2">
            {product.Category.name}
          </span>
        )}

        {product.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* {rating && (
          <div className="flex items-center mb-3">
            <div className="flex items-center mr-2">
              {renderStars(parseFloat(rating.toString()))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {rating} ({reviewCount} reviews)
            </span>
          </div>
        )} */}

        <div className="flex justify-between items-center mb-4">
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(product.price)} birr
          </span>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${product.stock > 0
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition transform hover:scale-105 shadow-md"
          >
            View Details
          </Link>
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-md"
              title="Add to Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
