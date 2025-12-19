import { Router } from 'express';
import multer from 'multer';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getRevenueAnalytics,
  getTopSellingProducts,
  getCustomerAnalytics,
  getOrderStatusDistribution,
  getLowStockProducts,
  updateProductStock,
  updatePaymentStatus,
  getAllOrders,
  bulkUpdateOrderStatus,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed') as any, false);
  },
});

router.use(authMiddleware);

router.use((req: any, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', upload.single('image'), createProduct);
router.put('/products/:id', upload.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);

// Dashboard and analytics
router.get('/dashboard-stats', getDashboardStats);

// Analytics routes
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/top-products', getTopSellingProducts);
router.get('/analytics/customers', getCustomerAnalytics);
router.get('/analytics/order-status', getOrderStatusDistribution);

// Low stock alerts
router.get('/products/low-stock', getLowStockProducts);
router.patch('/products/:id/stock', updateProductStock);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Category management
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Payment management
router.patch('/orders/payment-status', updatePaymentStatus);

// Order management
router.get('/orders', getAllOrders);
router.put('/orders/bulk-status', bulkUpdateOrderStatus);

export default router;
