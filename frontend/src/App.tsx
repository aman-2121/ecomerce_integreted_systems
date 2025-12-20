import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Admin from './pages/Admin';
import PaymentSuccess from './pages/PaymentSuccess';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import ResetPassword from './pages/ResetPassword';
import PaymentMethods from './pages/PaymentMethods';

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminUserPage = user?.role === 'admin' && (location.pathname === '/profile' || location.pathname === '/change-password' || location.pathname.startsWith('/orders'));

  const renderWithAdminLayout = (component: React.ReactElement) => (
    <AdminLayout>{component}</AdminLayout>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {!isAdminRoute && !isAdminUserPage && <Navbar />}
      <main className={isAdminRoute || isAdminUserPage ? "" : "container mx-auto px-4 py-8"}>
        <Routes>
          <Route path="/" element={user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/products" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={isAdminUserPage ? renderWithAdminLayout(<Profile />) : <Profile />} />
          <Route path="/orders" element={isAdminUserPage ? renderWithAdminLayout(<Orders />) : <Orders />} />
          <Route path="/orders/:id" element={isAdminUserPage ? renderWithAdminLayout(<OrderDetail />) : <OrderDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />

          <Route path="/change-password" element={isAdminUserPage ? renderWithAdminLayout(<ChangePassword />) : <ChangePassword />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
