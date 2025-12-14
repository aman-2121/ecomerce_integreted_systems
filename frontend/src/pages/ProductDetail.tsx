// frontend/src/pages/ProductDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productAPI } from '../api/auth';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    productAPI.getById(id!).then(res => {
      setProduct(res.data.product);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-2xl text-gray-900 dark:text-white">Loading...</div>;
  if (!product) return <div className="text-center py-20 text-red-600 dark:text-red-400 text-2xl">Product not found</div>;

  const formatPrice = (price: any) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const imageUrl = product.image
    ? `data:image/jpeg;base64,${product.image}`
    : 'https://via.placeholder.com/600x600.png?text=No+Image';

  const handleAddToCart = () => {
    if (!user) {
      // Store current location for redirect after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      // Navigate to login
      window.location.href = '/login';
      return;
    }

    if (product && quantity > 0) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: quantity,
        image: product.image || '',
        stock: product.stock
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      // Removed automatic redirect to cart page - user can navigate manually
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full rounded-3xl shadow-2xl object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600.png?text=No+Image';
            }}
          />
        </div>

        <div className="space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">${formatPrice(product.price)}</p>
          <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">{product.description || 'No description available.'}</p>

          <div className="flex items-center gap-6">
            <span className={`px-6 py-3 rounded-full text-lg font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
            {product.category && (
              <span className="px-6 py-3 bg-purple-100 text-purple-800 rounded-full text-lg font-medium">
                {product.category}
              </span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Quantity:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    min="1"
                    max={product.stock}
                    className="w-16 text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                    className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addedToCart}
                className={`w-full text-2xl font-bold py-6 rounded-2xl transition transform hover:scale-105 shadow-2xl ${
                  addedToCart
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          {product.stock === 0 && (
            <button
              disabled
              className="w-full bg-gray-400 text-white text-2xl font-bold py-6 rounded-2xl cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
     </div>
  );
};

export default ProductDetail;