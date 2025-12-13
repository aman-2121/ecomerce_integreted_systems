// backend/src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import axios from 'axios';
import Order from '../models/order.model';
import { UserPaymentMethod } from '../models/index';

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY!;
const CHAPA_URL = 'https://api.chapa.co/v1';

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { orderId, amount, email, first_name, last_name, phone_number } = req.body;

    if (!orderId || !amount || !email) {
      return res.status(400).json({ error: 'orderId, amount, and email are required' });
    }

    const tx_ref = `tx-${orderId}-${Date.now()}`;

    const payload = {
      amount: parseFloat(amount).toFixed(2),
      currency: 'ETB',
      email,
      first_name: first_name || 'Customer',
      last_name: last_name || '',
      phone_number: phone_number || '',
      tx_ref,
      callback_url: `${process.env.FRONTEND_URL}/api/payments/callback`,
      return_url: `${process.env.FRONTEND_URL}/payment/success?tx_ref=${tx_ref}`,
      customization: {
        title: 'E-Commerce Ethiopia',
        description: 'Thank you for shopping with us!',
        logo: `${process.env.FRONTEND_URL}/logo.png`,
      },
    };

    const response = await axios.post(`${CHAPA_URL}/transaction/initialize`, payload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    // Update order with tx_ref
    await Order.update({ paymentTxRef: tx_ref }, { where: { id: orderId } });

    res.json({
      success: true,
      checkout_url: response.data.data.checkout_url,
      tx_ref,
    });
  } catch (error: any) {
    console.error('Chapa Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Payment failed',
      details: error.response?.data || error.message,
    });
  }
};

export const paymentCallback = async (req: Request, res: Response) => {
  // Chapa will call this when payment status changes
  console.log('Chapa Callback:', req.body);
  res.status(200).send('OK');
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  // Frontend will call this to verify
  res.json({ status: 'success', message: 'Payment verified' });
};

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const paymentMethods = await UserPaymentMethod.findAll({
      where: { userId },
      attributes: ['id', 'type', 'provider', 'last4', 'brand', 'expiryMonth', 'expiryYear', 'isDefault']
    });
    res.json({ success: true, paymentMethods });
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, error: 'Failed to get payment methods' });
  }
};

export const addPaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, provider, last4, brand, expiryMonth, expiryYear, chapaToken } = req.body;

    if (!type || !provider) {
      return res.status(400).json({ error: 'Type and provider are required' });
    }

    const paymentMethod = await UserPaymentMethod.create({
      userId,
      type,
      provider,
      last4,
      brand,
      expiryMonth,
      expiryYear,
      chapaToken,
      isDefault: false
    });

    res.json({ success: true, paymentMethod });
  } catch (error: any) {
    console.error('Add payment method error:', error);
    res.status(500).json({ success: false, error: 'Failed to add payment method' });
  }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { isDefault } = req.body;

    const paymentMethod = await UserPaymentMethod.findOne({
      where: { id, userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    if (isDefault) {
      // Set all other methods to non-default
      await UserPaymentMethod.update(
        { isDefault: false },
        { where: { userId } }
      );
    }

    await paymentMethod.update({ isDefault });

    res.json({ success: true, paymentMethod });
  } catch (error: any) {
    console.error('Update payment method error:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment method' });
  }
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const paymentMethod = await UserPaymentMethod.findOne({
      where: { id, userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    await paymentMethod.destroy();

    res.json({ success: true, message: 'Payment method deleted' });
  } catch (error: any) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete payment method' });
  }
};
