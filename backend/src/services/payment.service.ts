import { Payment, Order } from '../models';
import axios from 'axios';

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  status: string;
  message?: string;
}

export class PaymentService {
  private static readonly CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY!;
  private static readonly CHAPA_BASE_URL = process.env.CHAPA_BASE_URL!;

  static async initiateChapaPayment(orderId: number, paymentData: any): Promise<PaymentResult> {
    try {
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const tx_ref = `tx-${orderId}-${Date.now()}`;

      const payload = {
        amount: parseFloat(order.totalAmount.toString()).toFixed(2),
        currency: 'ETB',
        email: paymentData.email,
        first_name: paymentData.first_name || 'Customer',
        last_name: paymentData.last_name || '',
        phone_number: paymentData.phone_number || '',
        tx_ref,
        callback_url: `${process.env.FRONTEND_URL}/api/payments/callback`,
        return_url: `${process.env.FRONTEND_URL}/payment/success?tx_ref=${tx_ref}`,
        customization: {
          title: 'E-Commerce Ethiopia',
          description: 'Thank you for shopping with us!',
          logo: `${process.env.FRONTEND_URL}/logo.png`,
        },
      };

      const response = await axios.post(`${this.CHAPA_BASE_URL}/transaction/initialize`, payload, {
        headers: {
          Authorization: `Bearer ${this.CHAPA_SECRET_KEY}`,
        },
      });

      // Update order with tx_ref
      await order.update({ paymentTxRef: tx_ref });

      // Create payment record
      await Payment.create({
        orderId,
        amount: order.totalAmount,
        paymentMethod: 'chapa',
        transactionId: tx_ref,
        status: 'pending'
      });

      return {
        success: true,
        transactionId: tx_ref,
        amount: parseFloat(order.totalAmount.toString()),
        status: 'pending',
        message: response.data.data.checkout_url
      };
    } catch (error: any) {
      console.error('Chapa payment initiation error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async verifyChapaPayment(tx_ref: string): Promise<PaymentResult> {
    try {
      const response = await axios.get(`${this.CHAPA_BASE_URL}/transaction/verify/${tx_ref}`, {
        headers: {
          Authorization: `Bearer ${this.CHAPA_SECRET_KEY}`,
        },
      });

      const { data } = response.data;

      const payment = await Payment.findOne({ where: { transactionId: tx_ref } });
      if (!payment) {
        throw new Error('Payment not found');
      }

      const order = await Order.findByPk(payment.orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (data.status === 'success') {
        await payment.update({ status: 'completed' });
        await order.update({ paymentStatus: 'paid' });
        return {
          success: true,
          transactionId: tx_ref,
          amount: parseFloat(data.amount),
          status: 'completed',
          message: 'Payment successful'
        };
      } else {
        await payment.update({ status: 'failed' });
        await order.update({ paymentStatus: 'failed' });
        return {
          success: false,
          transactionId: tx_ref,
          amount: parseFloat(data.amount),
          status: 'failed',
          message: 'Payment failed'
        };
      }
    } catch (error: any) {
      console.error('Chapa payment verification error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async processPayment(orderId: number, paymentData: any): Promise<PaymentResult> {
    // For backward compatibility, but now using Chapa
    return this.initiateChapaPayment(orderId, paymentData);
  }

  static async refundPayment(transactionId: string): Promise<PaymentResult> {
    try {
      const payment = await Payment.findOne({ where: { transactionId } });
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Chapa refund process
      const response = await axios.post(`${this.CHAPA_BASE_URL}/transaction/refund`, {
        transaction_id: transactionId
      }, {
        headers: {
          Authorization: `Bearer ${this.CHAPA_SECRET_KEY}`,
        },
      });

      await payment.update({ status: 'refunded' });
      
      return {
        success: true,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: 'refunded',
        message: 'Refund processed successfully'
      };
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }

  private static generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
