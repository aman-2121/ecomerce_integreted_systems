import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin?tab=analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin?tab=products', label: 'Products', icon: '📦' },
    { path: '/admin?tab=categories', label: 'Categories', icon: '🏷️' },
    { path: '/admin?tab=orders', label: 'Orders', icon: '📋' },
    { path: '/admin?tab=users', label: 'Users', icon: '👥' },
    { path: '/admin?tab=low-stock', label: 'Low Stock Alerts', icon: '⚠️' },
    { path: '/admin?tab=top-products', label: 'Top Products', icon: '🏆' },
    { path: '/admin?tab=settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' && !location.search.includes('tab=');
    }
    return location.search.includes(path.split('=')[1]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">E-Commerce</span>
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Admin Panel</p>
        </div>
        <nav className="mt-6">
          <div className="px-3 space-y-1">
            {adminLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Admin Panel</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
