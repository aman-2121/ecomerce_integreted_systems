// backend/src/routes/payment.routes.ts
import { Router } from 'express';
import {
  initiatePayment,
  paymentCallback,
  getPaymentStatus,
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  chapaWebhook,
  verifyPayment
} from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/initiate', authMiddleware, initiatePayment);
router.post('/callback', paymentCallback);
router.post('/chapa-webhook', chapaWebhook); // Chapa webhook endpoint
router.post('/verify', authMiddleware, verifyPayment);
router.get('/status/:orderId', authMiddleware, getPaymentStatus);

// Payment methods routes
router.get('/methods', authMiddleware, getPaymentMethods);
router.post('/methods', authMiddleware, addPaymentMethod);
router.put('/methods/:id', authMiddleware, updatePaymentMethod);
router.delete('/methods/:id', authMiddleware, deletePaymentMethod);

export default router;
