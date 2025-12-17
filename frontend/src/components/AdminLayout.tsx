import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkModeContext } from '../context/DarkModeContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkModeContext();
  const location = useLocation();
  const navigate = useNavigate();

  const handleTabChange = (tab: string) => {
    navigate(`/admin?tab=${tab}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          <div className="px-3">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'dashboard'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'analytics'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">📈</span>
              Analytics
            </button>
            <button
              onClick={() => handleTabChange('products')}
              className={`w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'products'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">📦</span>
              Products
            </button>
            <button
              onClick={() => handleTabChange('categories')}
              className={`w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'categories'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">📁</span>
              Categories
            </button>
            <button
              onClick={() => handleTabChange('orders')}
              className={`w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'orders'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">📋</span>
              Orders
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'users'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">👥</span>
              Users
            </button>
            <button
              onClick={() => handleTabChange('low-stock')}
              className={`w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'low-stock'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">⚠️</span>
              Low Stock
            </button>
            <button
              onClick={() => handleTabChange('top-products')}
              className={`w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'top-products'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">🏆</span>
              Top Products
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
          <div></div> {/* Spacer for center alignment if needed */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="flex items-center px-3 py-2 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="mr-2">{isDarkMode ? '☀️' : '🌙'}</span>
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center px-3 py-2 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="mr-2">👤</span>
              Profile
            </button>
            <button
              onClick={logout}
              className="flex items-center px-3 py-2 rounded-lg transition-colors duration-200 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
            >
              <span className="mr-2">🚪</span>
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
