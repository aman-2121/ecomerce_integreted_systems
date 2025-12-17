// frontend/src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../api/auth';
import ProductCard from '../components/ProductCard';

const Home: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productAPI.getAll();
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section - FIXED: Removed purple gradient */}
      <section className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
        {/* Your hero section content */}
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gray-900 dark:text-white">
              Welcome to <span className="text-blue-600 dark:text-blue-400">ShopWave</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Discover amazing products at great prices.
            </p>
            
            <div className="mb-10">
              <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg md:text-xl">
                Free shipping - Easy returns - 5-star service
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
              <Link
                to="/products"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold px-12 py-5 rounded-full transition-all duration-300"
              >
                Shop Now
              </Link>
              
              <Link
                to="/register"
                className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xl font-bold px-12 py-5 rounded-full transition-all duration-300"
              >
                Create Account
              </Link>
            </div>
            
            {/* Featured Products Section Heading */}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-8">
              Featured Products
            </h2>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Featured Products</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">Check out our most popular items</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <p className="text-2xl text-gray-600 dark:text-gray-300">No products available yet.</p>
            <Link to="/admin" className="mt-6 inline-block text-blue-600 dark:text-blue-400 hover:underline text-lg">
              Go to Admin → Add Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto px-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {products.length > 8 && (
          <div className="text-center mt-12">
            <Link
              to="/products"
              // FIXED: Removed purple gradient from button
              className="bg-blue-500 dark:bg-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500 text-white px-10 py-4 rounded-full text-xl font-bold transition transform hover:scale-105 shadow-xl"
            >
              View All Products →
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 rounded-3xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Why Shop With Us?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">
          <div className="text-center p-8 bg-white dark:bg-surface-dark rounded-2xl shadow-lg dark:shadow-gray-800 hover:shadow-2xl dark:hover:shadow-gray-700 transition-all duration-300">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Fast Delivery</h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Get your orders delivered quickly with our reliable shipping partners.
            </p>
          </div>

          <div className="text-center p-8 bg-white dark:bg-surface-dark rounded-2xl shadow-lg dark:shadow-gray-800 hover:shadow-2xl dark:hover:shadow-gray-700 transition-all duration-300">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Secure Payments</h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Your payments are safe with our secure Telebirr payment integration.
            </p>
          </div>

          <div className="text-center p-8 bg-white dark:bg-surface-dark rounded-2xl shadow-lg dark:shadow-gray-800 hover:shadow-2xl dark:hover:shadow-gray-700 transition-all duration-300">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">24/7 Support</h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Our customer support team is always here to help you with any questions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - FIXED: Removed purple gradient */}
      <section className="text-center py-20 bg-blue-600 dark:bg-blue-800 rounded-3xl text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Start Shopping?
        </h2>
        <p className="text-xl mb-10 max-w-2xl mx-auto">
          Join thousands of satisfied customers who trust us for their shopping needs.
        </p>
        <Link
          to="/products"
          className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-2xl font-bold px-12 py-5 rounded-full transition transform hover:scale-110 shadow-2xl"
        >
          Browse All Products
        </Link>
      </section>
    </div>
  );
};

export default Home;