import axios from 'axios';
import crypto from 'crypto';

interface TelebirrPaymentRequest {
  amount: number;
  orderId: string;
  customerPhone: string;
  customerEmail: string;
}

interface TelebirrPaymentResponse {
  success: boolean;
  paymentUrl: string;
  transactionId: string;
  message?: string;
}

interface TelebirrVerificationResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  status: string;
  message?: string;
}

export class TelebirrService {
  private static baseUrl = process.env.TELEBIRR_BASE_URL || 'https://api.telebirr.com';
  private static appId = process.env.TELEBIRR_APP_ID || 'your_app_id';
  private static appKey = process.env.TELEBIRR_APP_KEY || 'your_app_key';
  private static publicKey = process.env.TELEBIRR_PUBLIC_KEY || 'your_public_key';

  static async initiatePayment(request: TelebirrPaymentRequest): Promise<TelebirrPaymentResponse> {
    try {
      const timestamp = Date.now().toString();
      const nonce = Math.random().toString(36).substring(7);
      
      const payload = {
        appId: this.appId,
        amount: request.amount.toString(),
        orderId: request.orderId,
        customerPhone: request.customerPhone,
        customerEmail: request.customerEmail,
        timestamp,
        nonce,
        notifyUrl: process.env.TELEBIRR_NOTIFY_URL
      };

      // Sign the payload
      const signature = this.generateSignature(payload);

      const requestData = {
        ...payload,
        sign: signature
      };

      // Make API call to Telebirr
      const response = await axios.post(`${this.baseUrl}/api/v1/payment/create`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.appKey}`
        }
      });

      if (response.data.code === '200') {
        return {
          success: true,
          paymentUrl: response.data.data.paymentUrl,
          transactionId: response.data.data.transactionId
        };
      } else {
        return {
          success: false,
          paymentUrl: '',
          transactionId: '',
          message: response.data.message || 'Payment initiation failed'
        };
      }
    } catch (error) {
      console.error('Telebirr payment initiation error:', error);
      return {
        success: false,
        paymentUrl: '',
        transactionId: '',
        message: 'Payment service temporarily unavailable'
      };
    }
  }

  static async verifyPayment(callbackData: any): Promise<TelebirrVerificationResponse> {
    try {
      // Verify the callback signature
      const isValid = this.verifySignature(callbackData);
      
      if (!isValid) {
        return {
          success: false,
          transactionId: '',
          amount: 0,
          status: 'failed',
          message: 'Invalid signature'
        };
      }

      // Check payment status from callback data
      if (callbackData.status === 'SUCCESS') {
        return {
          success: true,
          transactionId: callbackData.transactionId,
          amount: parseFloat(callbackData.amount),
          status: 'completed'
        };
      } else {
        return {
          success: false,
          transactionId: callbackData.transactionId,
          amount: parseFloat(callbackData.amount),
          status: 'failed',
          message: callbackData.message || 'Payment failed'
        };
      }
    } catch (error) {
      console.error('Telebirr payment verification error:', error);
      return {
        success: false,
        transactionId: '',
        amount: 0,
        status: 'failed',
        message: 'Verification failed'
      };
    }
  }

  private static generateSignature(payload: any): string {
    const sortedKeys = Object.keys(payload).sort();
    const signString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
    return crypto.createHmac('sha256', this.appKey).update(signString).digest('hex');
  }

  private static verifySignature(callbackData: any): boolean {
    const receivedSignature = callbackData.sign;
    delete callbackData.sign;

    const calculatedSignature = this.generateSignature(callbackData);
    return receivedSignature === calculatedSignature;
  }
}

// Export convenience functions
export const initiateTelebirrPayment = TelebirrService.initiatePayment.bind(TelebirrService);
export const verifyTelebirrPayment = TelebirrService.verifyPayment.bind(TelebirrService);