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
  // Removed static properties to avoid initialization before dotenv loads


  static async initiateChapaPayment(orderId: number, paymentData: any): Promise<PaymentResult> {
    console.log('=== PAYMENT SERVICE: INITIATE CHAPA PAYMENT START ===');
    console.log('Order ID:', orderId, 'Type:', typeof orderId);
    console.log('Payment data:', JSON.stringify(paymentData, null, 2));

    try {
      console.log('Checking environment variables...');
      console.log('CHAPA_SECRET_KEY exists:', !!process.env.CHAPA_SECRET_KEY);
      console.log('CHAPA_BASE_URL:', process.env.CHAPA_BASE_URL);
      console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

      if (!process.env.CHAPA_SECRET_KEY) {
        throw new Error('CHAPA_SECRET_KEY is not defined in environment variables');
      }

      if (!process.env.CHAPA_BASE_URL) {
        throw new Error('CHAPA_BASE_URL is not defined in environment variables');
      }

      console.log('Looking for order with ID:', orderId);
      const order = await Order.findByPk(orderId);
      console.log('Order found:', order ? `Yes (ID: ${order.id})` : 'No');

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      console.log('Order details:', {
        id: order.id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus
      });

      const tx_ref = `tx-${orderId}-${Date.now()}`;
      console.log('Generated transaction reference:', tx_ref);

      const payload = {
        amount: parseFloat(order.totalAmount.toString()).toFixed(2),
        currency: 'ETB',
        email: paymentData.email,
        first_name: paymentData.first_name || 'Customer',
        last_name: paymentData.last_name || '',
        phone_number: paymentData.phone_number ? paymentData.phone_number.replace(/\s+/g, '').replace(/^\+251/, '') : '',
        tx_ref,
        callback_url: `${process.env.FRONTEND_URL}/api/payments/callback`,
        return_url: `${process.env.FRONTEND_URL}/payment/success?tx_ref=${tx_ref}`,
        webhook_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/chapa-webhook`,
        customization: {
          title: 'E-Com Ethiopia',
          description: 'Thank you for shopping with us',
          logo: `${process.env.FRONTEND_URL}/logo.png`,
        },
      };

      console.log('Chapa API Request Payload:', JSON.stringify(payload, null, 2));
      console.log('Chapa API URL:', `${process.env.CHAPA_BASE_URL}/transaction/initialize`);
      console.log('Authorization Header:', `Bearer ${process.env.CHAPA_SECRET_KEY.substring(0, 10)}...`);

      const response = await axios.post(
        `${process.env.CHAPA_BASE_URL}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Chapa API Response Status:', response.status);
      console.log('Chapa API Response Headers:', response.headers);
      console.log('Chapa API Response Data:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.data || !response.data.data.checkout_url) {
        throw new Error('Invalid response from Chapa API: Missing checkout_url');
      }

      console.log('Updating order with tx_ref:', tx_ref);
      await order.update({ paymentTxRef: tx_ref });
      console.log('Order updated successfully');

      console.log('Creating payment record...');
      const paymentRecord = await Payment.create({
        orderId,
        amount: order.totalAmount,
        paymentMethod: 'chapa',
        transactionId: tx_ref,
        status: 'pending'
      });
      console.log('Payment record created:', JSON.stringify(paymentRecord.toJSON(), null, 2));

      const result = {
        success: true,
        transactionId: tx_ref,
        amount: parseFloat(order.totalAmount.toString()),
        status: 'pending',
        message: response.data.data.checkout_url
      };

      console.log('Payment initiation successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('=== PAYMENT SERVICE: INITIATE CHAPA PAYMENT END (SUCCESS) ===');

      return result;
    } catch (error: any) {
      console.error('=== PAYMENT SERVICE: INITIATE CHAPA PAYMENT ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Response Headers:', error.response?.headers);
        console.error('Request URL:', error.config?.url);
        console.error('Request Method:', error.config?.method);
        console.error('Request Headers:', error.config?.headers);
        console.error('Request Data:', error.config?.data);
      } else if (error instanceof Error) {
        console.error('Standard Error:', error.message);
      }

      console.error('Full error object:', error);
      console.log('=== PAYMENT SERVICE: INITIATE CHAPA PAYMENT END (ERROR) ===');

      throw error;
    }
  }

  static async verifyChapaPayment(tx_ref: string): Promise<PaymentResult> {
    console.log('=== PAYMENT SERVICE: VERIFY CHAPA PAYMENT START ===');
    console.log('Transaction reference:', tx_ref);

    try {
      console.log('Verifying payment with Chapa API...');
      console.log('API URL:', `${process.env.CHAPA_BASE_URL}/transaction/verify/${tx_ref}`);

      const response = await axios.get(`${process.env.CHAPA_BASE_URL}/transaction/verify/${tx_ref}`, {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      });

      console.log('Chapa Verification Response Status:', response.status);
      console.log('Chapa Verification Response Data:', JSON.stringify(response.data, null, 2));

      const { data } = response.data;
      console.log('Extracted data from response:', JSON.stringify(data, null, 2));

      console.log('Looking for payment with transactionId:', tx_ref);
      const payment = await Payment.findOne({ where: { transactionId: tx_ref } });
      console.log('Payment found:', payment ? `Yes (ID: ${payment.id})` : 'No');

      if (!payment) {
        throw new Error(`Payment with transactionId ${tx_ref} not found`);
      }

      console.log('Looking for order with ID:', payment.orderId);
      const order = await Order.findByPk(payment.orderId);
      console.log('Order found:', order ? `Yes (ID: ${order.id})` : 'No');

      if (!order) {
        throw new Error(`Order with ID ${payment.orderId} not found`);
      }

      console.log('Payment status from Chapa:', data.status);

      if (data.status === 'success') {
        console.log('Processing successful payment...');
        await payment.update({ status: 'completed' });
        console.log('Payment updated to completed');
        await order.update({ paymentStatus: 'paid' });
        console.log('Order updated to paid');

        const result = {
          success: true,
          transactionId: tx_ref,
          amount: parseFloat(data.amount),
          status: 'completed',
          message: 'Payment successful'
        };

        console.log('Verification result:', JSON.stringify(result, null, 2));
        console.log('=== PAYMENT SERVICE: VERIFY CHAPA PAYMENT END (SUCCESS) ===');
        return result;
      } else {
        console.log('Processing failed payment...');
        await payment.update({ status: 'failed' });
        console.log('Payment updated to failed');
        await order.update({ paymentStatus: 'failed' });
        console.log('Order updated to failed');

        const result = {
          success: false,
          transactionId: tx_ref,
          amount: parseFloat(data.amount),
          status: 'failed',
          message: `Payment failed with status: ${data.status}`
        };

        console.log('Verification result:', JSON.stringify(result, null, 2));
        console.log('=== PAYMENT SERVICE: VERIFY CHAPA PAYMENT END (FAILED) ===');
        return result;
      }
    } catch (error: any) {
      console.error('=== PAYMENT SERVICE: VERIFY CHAPA PAYMENT ERROR ===');
      console.error('Error during payment verification:', error.message);

      if (axios.isAxiosError(error)) {
        console.error('Axios Error Response:', error.response?.data);
        console.error('Axios Error Status:', error.response?.status);
      }

      console.error('Full error:', error);
      console.log('=== PAYMENT SERVICE: VERIFY CHAPA PAYMENT END (ERROR) ===');

      throw error;
    }
  }

  static async processPayment(orderId: number, paymentData: any): Promise<PaymentResult> {
    console.log('=== PAYMENT SERVICE: PROCESS PAYMENT START ===');
    console.log('Order ID:', orderId);
    console.log('Payment data:', JSON.stringify(paymentData, null, 2));

    // For backward compatibility, but now using Chapa
    console.log('Redirecting to initiateChapaPayment...');
    const result = await this.initiateChapaPayment(orderId, paymentData);

    console.log('Process payment result:', JSON.stringify(result, null, 2));
    console.log('=== PAYMENT SERVICE: PROCESS PAYMENT END ===');

    return result;
  }

  static async refundPayment(transactionId: string): Promise<PaymentResult> {
    console.log('=== PAYMENT SERVICE: REFUND PAYMENT START ===');
    console.log('Transaction ID for refund:', transactionId);

    try {
      console.log('Looking for payment with transactionId:', transactionId);
      const payment = await Payment.findOne({ where: { transactionId } });
      console.log('Payment found:', payment ? `Yes (ID: ${payment.id})` : 'No');

      if (!payment) {
        throw new Error(`Payment with transactionId ${transactionId} not found`);
      }

      console.log('Payment details for refund:', {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        orderId: payment.orderId
      });

      console.log('Initiating refund with Chapa API...');
      console.log('API URL:', `${process.env.CHAPA_BASE_URL}/transaction/refund`);
      console.log('Refund payload:', { transaction_id: transactionId });

      const response = await axios.post(
        `${process.env.CHAPA_BASE_URL}/transaction/refund`,
        {
          transaction_id: transactionId
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          },
        }
      );

      console.log('Chapa Refund Response Status:', response.status);
      console.log('Chapa Refund Response Data:', JSON.stringify(response.data, null, 2));

      console.log('Updating payment status to refunded...');
      await payment.update({ status: 'refunded' });
      console.log('Payment status updated');

      const result = {
        success: true,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: 'refunded',
        message: 'Refund processed successfully'
      };

      console.log('Refund result:', JSON.stringify(result, null, 2));
      console.log('=== PAYMENT SERVICE: REFUND PAYMENT END (SUCCESS) ===');

      return result;
    } catch (error: any) {
      console.error('=== PAYMENT SERVICE: REFUND PAYMENT ERROR ===');
      console.error('Error during refund processing:', error.message);

      if (axios.isAxiosError(error)) {
        console.error('Axios Error Response:', error.response?.data);
        console.error('Axios Error Status:', error.response?.status);
      }

      console.error('Full error:', error);
      console.log('=== PAYMENT SERVICE: REFUND PAYMENT END (ERROR) ===');

      throw error;
    }
  }

  private static generateTransactionId(): string {
    const txId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated transaction ID:', txId);
    return txId;
  }
}