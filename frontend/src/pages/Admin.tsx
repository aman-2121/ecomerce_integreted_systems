// frontend/src/pages/Admin.tsx (Updated - removed navigation away from admin)
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkModeContext } from '../context/DarkModeContext';
import { adminAPI } from '../api/auth';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  image: string | null;
  category: string | null;
}

interface Order {
  id: number;
  totalAmount: number | string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user?: { id: number; name: string; email: string };
  customerName?: string;
  customerEmail?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkModeContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'products' | 'categories' | 'orders' | 'users' | 'low-stock' | 'top-products'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dashboardStats, setDashboardStats] = useState({ totalUsers: 0, totalOrders: 0, totalProducts: 0, totalRevenue: 0 });

  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchOrders, setSearchOrders] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const [searchLowStock, setSearchLowStock] = useState('');
  const [searchTopProducts, setSearchTopProducts] = useState('');
  const [searchProducts, setSearchProducts] = useState('');
  const [searchCategories, setSearchCategories] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // Low stock state
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [stockThreshold, setStockThreshold] = useState(3);

  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    category: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: ''
  });

  const [message, setMessage] = useState<string | null>(null);

  const safePrice = (price: any): string => {
    const num = typeof price === 'string' ? parseFloat(price) : Number(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'analytics', 'products', 'categories', 'orders', 'users', 'low-stock', 'top-products'].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
  }, [location.search]);

  const handleSelectAllOrders = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id: number) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedOrders.length === 0) return;

    if (window.confirm(`Are you sure you want to update ${selectedOrders.length} orders to ${bulkStatus}?`)) {
      setLoadingOrders(true);
      try {
        const currentCount = selectedOrders.length;
        const currentStatus = bulkStatus;
        console.log('Bulk updating orders:', { ids: selectedOrders, status: bulkStatus });
        setMessage(`Updating ${currentCount} orders to ${currentStatus}...`);

        await adminAPI.bulkUpdateOrderStatus(selectedOrders, bulkStatus);

        await fetchOrders();
        setMessage(`Successfully updated ${currentCount} orders to ${currentStatus}`);
        setSelectedOrders([]);
        setBulkStatus('');
      } catch (err) {
        console.error('Bulk update failed:', err);
        setMessage('Error: Failed to update orders');
      } finally {
        setLoadingOrders(false);
      }
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toString().includes(searchOrders) ||
    (order.user?.name || '').toLowerCase().includes(searchOrders.toLowerCase()) ||
    (order.user?.email || '').toLowerCase().includes(searchOrders.toLowerCase()) ||
    (order.customerName || '').toLowerCase().includes(searchOrders.toLowerCase()) ||
    (order.customerEmail || '').toLowerCase().includes(searchOrders.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredLowStock = lowStockProducts.filter(p =>
    p.name.toLowerCase().includes(searchLowStock.toLowerCase())
  );

  const filteredTopProducts = topSellingProducts.filter(p =>
    p.name.toLowerCase().includes(searchTopProducts.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProducts.toLowerCase()) ||
    (product.description || '').toLowerCase().includes(searchProducts.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchProducts.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchCategories.toLowerCase()) ||
    (category.description || '').toLowerCase().includes(searchCategories.toLowerCase())
  );


  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const oRes = await adminAPI.getAllOrders();
      setOrders(oRes.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [pRes, oRes, uRes, cRes, sRes] = await Promise.all([
        adminAPI.getAllProducts(),
        adminAPI.getAllOrders(),
        adminAPI.getAllUsers(),
        adminAPI.getAllCategories(),
        adminAPI.getDashboardStats().catch(() => ({ data: {} }))
      ]);

      setProducts(pRes.data.products || []);
      setOrders(oRes.data.orders || []);
      setUsers(uRes.data.users || []);
      setCategories(cRes.data.categories || cRes.data || []);
      setDashboardStats(sRes.data || {
        totalUsers: uRes.data.users?.length || 0,
        totalOrders: oRes.data.orders?.length || 0,
        totalProducts: pRes.data.products?.length || 0,
        totalRevenue: 0
      });

      // Filter low stock products
      const lowStock = (pRes.data.products || []).filter((product: Product) => product.stock <= stockThreshold);
      setLowStockProducts(lowStock);

      // Load top selling products from API
      await loadTopSellingProducts();
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const loadTopSellingProducts = async () => {
    try {
      setTopProductsLoading(true);
      const response = await adminAPI.getTopSellingProducts({ limit: 10 });
      setTopSellingProducts(response.data.topProducts || []);
    } catch (err) {
      console.error('Failed to load top selling products:', err);
      setTopSellingProducts([]);
    } finally {
      setTopProductsLoading(false);
    }
  };


  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const priceNum = parseFloat(productForm.price);
    const stockNum = parseInt(productForm.stock, 10);

    if (!productForm.name || isNaN(priceNum) || isNaN(stockNum) || !productForm.image) {
      setMessage('Please fill all required fields correctly');
      return;
    }

    const formData = new FormData();
    formData.append('name', productForm.name.trim());
    formData.append('description', productForm.description.trim());
    formData.append('price', priceNum.toString());
    formData.append('stock', stockNum.toString());
    formData.append('category', productForm.category.trim());
    formData.append('image', productForm.image.trim()); // String URL

    try {
      editingProduct
        ? await adminAPI.updateProduct(editingProduct.id.toString(), formData)
        : await adminAPI.createProduct(formData);

      setMessage(editingProduct ? 'Product updated!' : 'Product created!');
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', stock: '', image: '', category: '' });
      loadAllData();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed');
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: safePrice(p.price),
      stock: p.stock.toString(),
      image: p.image || '',
      category: p.category || ''
    });
    setShowProductForm(true);
    setActiveTab('products'); // Switch to products tab to show the form
  };

  const deleteProduct = async (id: number) => {
    if (window.confirm('Delete product?')) {
      await adminAPI.deleteProduct(id.toString());
      loadAllData();
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { name: categoryForm.name, description: categoryForm.description, image: categoryForm.image };
      editingCategory
        ? await adminAPI.updateCategory(editingCategory.id.toString(), data)
        : await adminAPI.createCategory(data);
      setMessage('Category saved!');
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', image: '' });
      loadAllData();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Error');
    }
  };

  const deleteCategory = async (id: number) => {
    if (window.confirm('Delete category?')) {
      await adminAPI.deleteCategory(id.toString());
      loadAllData();
    }
  };

  const deleteUser = async (id: number) => {
    if (window.confirm('Delete user?')) {
      await adminAPI.deleteUser(id.toString());
      loadAllData();
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    await adminAPI.updateOrderStatus(id.toString(), status);
    loadAllData();
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 transform hover:scale-105"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getOrderStatusData = () => {
    const statusCounts = {
      pending: (orders || []).filter(o => o.status === 'pending').length,
      confirmed: (orders || []).filter(o => o.status === 'confirmed').length,
      shipped: (orders || []).filter(o => o.status === 'shipped').length,
      delivered: (orders || []).filter(o => o.status === 'delivered').length,
      cancelled: (orders || []).filter(o => o.status === 'cancelled').length
    };

    const labels = Object.keys(statusCounts).filter(key => statusCounts[key as keyof typeof statusCounts] > 0);
    const data = labels.map(key => statusCounts[key as keyof typeof statusCounts]);
    const backgroundColor = labels.map(key => {
      const colorMap = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        shipped: '#8b5cf6',
        delivered: '#10b981',
        cancelled: '#ef4444'
      };
      return colorMap[key as keyof typeof colorMap];
    });

    return { labels, datasets: [{ data, backgroundColor }] };
  };

  const orderStatusData = getOrderStatusData();

  const handleTabChange = (tab: typeof activeTab) => {
    navigate(`/admin?tab=${tab}`);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg min-h-screen">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          </div>
          <nav className="mt-6">
            {[
              { key: 'dashboard', label: '📊 Dashboard' },
              { key: 'analytics', label: '📈 Analytics' },
              { key: 'products', label: '📦 Products' },
              { key: 'categories', label: '📁 Categories' },
              { key: 'orders', label: '📋 Orders' },
              { key: 'users', label: '👥 Users' },
              { key: 'low-stock', label: '⚠️ Low Stock' },
              { key: 'top-products', label: '🏆 Top Products' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as typeof activeTab)}
                className={`w-full text-left px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === tab.key ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/profile')} className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                👤 Profile
              </button>
              <button onClick={toggleDarkMode} className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                {isDarkMode ? '🌙' : '☀️'}
              </button>
              <button onClick={() => { logout(); navigate('/home'); }} className="p-2 rounded bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors">🚪 Logout</button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {message && (
              <div className={`p-4 rounded-lg mb-6 text-center text-lg font-medium ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {message}
              </div>
            )}

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Users</p>
                        <p className="text-3xl font-bold">{dashboardStats.totalUsers}</p>
                      </div>
                      <div className="bg-blue-400 bg-opacity-30 p-3 rounded-xl">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Total Orders</p>
                        <p className="text-3xl font-bold">{dashboardStats.totalOrders}</p>
                      </div>
                      <div className="bg-green-400 bg-opacity-30 p-3 rounded-xl">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Total Products</p>
                        <p className="text-3xl font-bold">{dashboardStats.totalProducts}</p>
                      </div>
                      <div className="bg-purple-400 bg-opacity-30 p-3 rounded-xl">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Revenue</p>
                        <p className="text-3xl font-bold">{safePrice(dashboardStats.totalRevenue)} birr</p>
                      </div>
                      <div className="bg-orange-400 bg-opacity-30 p-3 rounded-xl">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setActiveTab('products');
                        setEditingProduct(null);
                        setProductForm({ name: '', description: '', price: '', stock: '', image: '', category: '' });
                        setShowProductForm(true);
                      }}
                      className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all duration-200 group"
                    >
                      <div className="bg-blue-500 p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Add Product</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Create new products</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('orders')}
                      className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all duration-200 group"
                    >
                      <div className="bg-green-500 p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Manage Orders</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Update order status</p>
                      </div>
                    </button>

                    {/* Removed the "View Store" button to keep users in admin panel */}
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl">
                  <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Order Status Distribution</h2>
                  {orders.length > 0 ? (
                    <Pie data={orderStatusData} options={{
                      plugins: {
                        legend: {
                          labels: {
                            color: isDarkMode ? '#fff' : '#000'
                          }
                        }
                      }
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-gray-500 dark:text-gray-400">Loading analytics data...</div>
                    </div>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl">
                  <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Revenue Trend (Mock)</h2>
                  <Line data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{ label: 'Revenue', data: [12000, 19000, 15000, 25000, 22000, 30000], borderColor: '#8b5cf6', tension: 0.4 }]
                  }} options={{
                    plugins: {
                      legend: {
                        labels: {
                          color: isDarkMode ? '#fff' : '#000'
                        }
                      }
                    }
                  }} />
                </div>
              </div>
            )}

            {/* PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h2>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: '', description: '', price: '', stock: '', image: '', category: '' });
                      setShowProductForm(true);
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    + Add Product
                  </button>
                </div>

                {showProductForm && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-300 dark:border-gray-700 min-h-[400px]">
                    <h3 className="text-xl font-bold text-black dark:text-white mb-6">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <form onSubmit={handleProductSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">Product Name</label>
                          <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (birr)</label>
                          <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stock Quantity</label>
                          <input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                          <input type="text" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., Electronics, Clothing, Home" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Image URL</label>
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg or /hoodie.jpg"
                          value={productForm.image}
                          onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required={!editingProduct}
                        />
                        {productForm.image && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                            <img src={productForm.image} alt="Preview" className="h-32 w-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600" onError={(e) => (e.currentTarget.src = '/placeholder.png')} />
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-4">
                        <button type="submit" className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl">Save</button>
                        <button type="button" onClick={() => setShowProductForm(false)} className="bg-gray-500 text-white px-6 py-3 rounded-xl">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="mb-6">
                  <div className="relative max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search products by name, description, or category..."
                      className="pl-10 input-field w-full"
                      value={searchProducts}
                      onChange={(e) => setSearchProducts(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Products ({filteredProducts.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  <img
                                    className="h-12 w-12 rounded-lg object-cover"
                                    src={product.image || '/placeholder.png'}
                                    alt={product.name}
                                    onError={(e) => (e.currentTarget.src = '/placeholder.png')}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{product.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {safePrice(product.price)} birr
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                {product.stock} in stock
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button onClick={() => startEditProduct(product)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-lg">Edit</button>
                              <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900 px-3 py-1 rounded-lg">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category Management</h2>
                  <button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '', image: '' }); setShowCategoryForm(true); }} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl">+ Add Category</button>
                </div>

                {showCategoryForm && (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-300 dark:border-gray-700">
                    <form onSubmit={handleCategorySubmit} className="space-y-6">
                      <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      <textarea placeholder="Description" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      <input type="url" placeholder="Image URL" value={categoryForm.image} onChange={e => setCategoryForm({ ...categoryForm, image: e.target.value })} className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      <div className="flex gap-4">
                        <button type="submit" className="bg-green-600 text-white px-8 py-4 rounded-xl">Save</button>
                        <button type="button" onClick={() => setShowCategoryForm(false)} className="bg-gray-600 text-white px-8 py-4 rounded-xl">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="mb-6">
                  <div className="relative max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search categories by name or description..."
                      className="pl-10 input-field w-full"
                      value={searchCategories}
                      onChange={(e) => setSearchCategories(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Categories ({filteredCategories.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {categories.map(cat => (
                          <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{cat.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{cat.description || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '', image: cat.image || '' }); setShowCategoryForm(true); }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-lg">Edit</button>
                              <button onClick={() => deleteCategory(cat.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900 px-3 py-1 rounded-lg">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h2>
                  <button
                    onClick={loadAllData}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Refresh
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search orders (ID, customer, email)..."
                      className="pl-10 input-field w-full"
                      value={searchOrders}
                      onChange={(e) => setSearchOrders(e.target.value)}
                    />
                  </div>

                  {selectedOrders.length > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300 ml-2">
                        {selectedOrders.length} selected
                      </span>
                      <select
                        className="input-field py-1 text-sm bg-white dark:bg-gray-800 ml-2"
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value)}
                      >
                        <option value="">Bulk Actions...</option>
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="shipped">shipped</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <button
                        onClick={handleBulkStatusUpdate}
                        disabled={!bulkStatus || loadingOrders}
                        className="btn-primary py-1 px-4 text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              className="rounded text-blue-600 focus:ring-blue-500"
                              onChange={handleSelectAllOrders}
                              checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id))}
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Products</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredOrders.map((order: any) => (
                          <tr key={order.id} className={selectedOrders.includes(order.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}>
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                className="rounded text-blue-600 focus:ring-blue-500"
                                checked={selectedOrders.includes(order.id)}
                                onChange={() => handleSelectOrder(order.id)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">#{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="font-medium">{order.customerName || order.user?.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.customerEmail || order.user?.email || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              <div className="max-w-xs space-y-2">
                                {(() => {
                                  const items = order.items || order.OrderItems;
                                  if (!items || items.length === 0) {
                                    return <span className="text-gray-400 italic font-medium">No items found</span>;
                                  }
                                  return items.map((item: any) => {
                                    const prod = item.product || item.Product;
                                    return (
                                      <div key={item.id} className="flex items-center gap-3 bg-gray-50/50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-600">
                                        {prod?.image ? (
                                          <img
                                            src={prod.image}
                                            alt={prod?.name}
                                            className="w-10 h-10 object-cover rounded-md shadow-sm border border-white dark:border-gray-500 flex-shrink-0"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] text-gray-400 font-bold">IMAGE</span>
                                          </div>
                                        )}
                                        <div className="flex flex-col min-w-0 pr-1">
                                          <span className="font-semibold text-gray-900 dark:text-white truncate text-xs leading-tight">
                                            {prod?.name || 'Unknown Product'}
                                          </span>
                                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                            Qty: <span className="text-blue-600 dark:text-blue-400 font-bold">{item.quantity}</span>
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">{safePrice(order.totalAmount)} birr</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {order.paymentStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={order.status}
                                onChange={e => updateOrderStatus(order.id, e.target.value)}
                                className="input-field py-1 text-xs"
                              >
                                <option value="pending">pending</option>
                                <option value="confirmed">confirmed</option>
                                <option value="shipped">shipped</option>
                                <option value="delivered">delivered</option>
                                <option value="cancelled">cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
                  <button onClick={loadAllData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Refresh</button>
                </div>

                <div className="mb-6">
                  <div className="relative max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      className="pl-10 input-field w-full"
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{u.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {u.role !== 'admin' && (
                              <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg">Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LOW STOCK ALERTS */}
            {activeTab === 'low-stock' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Low Stock Alerts</h2>
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Threshold:</label>
                    <input
                      type="number"
                      value={stockThreshold}
                      onChange={(e) => {
                        const newThreshold = parseInt(e.target.value, 10);
                        setStockThreshold(newThreshold);
                        const lowStock = products.filter((product: Product) => product.stock <= newThreshold);
                        setLowStockProducts(lowStock);
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-20"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="relative max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search low stock products..."
                      className="pl-10 input-field w-full"
                      value={searchLowStock}
                      onChange={(e) => setSearchLowStock(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    {filteredLowStock.length > 0 ? (
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredLowStock.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img className="h-10 w-10 rounded-lg object-cover" src={product.image || '/placeholder.png'} alt={product.name} />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{safePrice(product.price)} birr</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.stock > 0 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                  {product.stock} left
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => startEditProduct(product)} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-lg">Edit</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-12 text-center text-gray-500 dark:text-gray-400">No low stock products found matching your search.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TOP PRODUCTS */}
            {activeTab === 'top-products' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Selling Products</h2>
                    {topProductsLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
                  </div>
                  <div className="relative max-w-sm">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search top products..."
                      className="pl-10 input-field w-full"
                      value={searchTopProducts}
                      onChange={(e) => setSearchTopProducts(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTopProducts.map((product, index) => (
                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow border border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <img className="w-full h-48 object-cover" src={product.image || '/placeholder.png'} alt={product.name} />
                        <div className="absolute top-3 left-3 bg-yellow-400 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">#{index + 1}</div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{product.name}</h3>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-xl font-bold text-emerald-600">{safePrice(product.price)} birr</span>
                          <span className="text-sm font-medium text-gray-500">{product.salesCount || 0} sold</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => startEditProduct(product)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Edit</button>
                          <button onClick={() => setActiveTab('products')} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">View All</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredTopProducts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">No top products found matching your search.</div>
                  )}
                </div>
              </div>
            )}

          </div >

        </div >

      </div >

    </div >

  );

};

export default Admin;
