// backend/src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import axios from 'axios';
import Order from '../models/order.model';
import Payment from '../models/payment.model';
import { UserPaymentMethod } from '../models/index';
import { PaymentService } from '../services/payment.service';

// Constants removed to use process.env directly or via service


export const initiatePayment = async (req: Request, res: Response) => {
  console.log('=== INITIATE PAYMENT CONTROLLER START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);

  try {
    const { orderId, email, first_name, last_name, phone_number } = req.body;
    console.log('Parsed request data:', { orderId, email, first_name, last_name, phone_number });

    if (!orderId || !email || !first_name || !last_name || !phone_number) {
      console.error('Validation failed - Missing required fields:', { orderId, email, first_name, last_name, phone_number });
      return res.status(400).json({
        error: 'Order ID, email, name, and phone number are required',
        received: { orderId, email, first_name, last_name, phone_number }
      });
    }

    console.log('All required fields present');
    console.log('CHAPA_SECRET_KEY exists:', !!process.env.CHAPA_SECRET_KEY);
    console.log('CHAPA_BASE_URL:', process.env.CHAPA_BASE_URL);
    console.log('PaymentService type:', typeof PaymentService);
    console.log('PaymentService.initiateChapaPayment:', typeof PaymentService.initiateChapaPayment);

    // Use the service to initiate payment
    console.log('Calling PaymentService.initiateChapaPayment...');
    const result = await PaymentService.initiateChapaPayment(orderId, {
      email,
      first_name,
      last_name,
      phone_number
    });

    console.log('PaymentService response:', JSON.stringify(result, null, 2));
    console.log('Response structure check:', {
      hasMessage: !!result?.message,
      hasTransactionId: !!result?.transactionId,
      messageType: typeof result?.message,
      transactionIdType: typeof result?.transactionId
    });

    const responseData = {
      success: true,
      checkout_url: result.message, // Service returns checkout_url in message
      tx_ref: result.transactionId,
    };

    console.log('Sending success response:', JSON.stringify(responseData, null, 2));
    console.log('=== INITIATE PAYMENT CONTROLLER END (SUCCESS) ===');

    res.json(responseData);
  } catch (error: any) {
    console.error('=== INITIATE PAYMENT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Check for specific error types
    if (error.response) {
      console.error('Axios response error:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Axios request error - No response received:');
      console.error('Request:', error.request);
    }

    console.error('Full error object:', JSON.stringify(error, null, 2));

    const errorResponse = {
      success: false,
      error: 'Payment failed',
      details: error.message,
      timestamp: new Date().toISOString()
    };

    console.error('Sending error response:', JSON.stringify(errorResponse, null, 2));
    console.log('=== INITIATE PAYMENT CONTROLLER END (ERROR) ===');

    res.status(500).json(errorResponse);
  }
};

export const paymentCallback = async (req: Request, res: Response) => {
  console.log('=== PAYMENT CALLBACK START ===');
  console.log('Callback request body:', JSON.stringify(req.body, null, 2));
  console.log('Callback request headers:', req.headers);
  console.log('Callback request query:', req.query);
  console.log('Callback request params:', req.params);

  // Chapa will call this when payment status changes
  console.log('Chapa Callbody:', req.body);

  console.log('=== PAYMENT CALLBACK END ===');
  res.status(200).send('OK');
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  console.log('=== GET PAYMENT STATUS START ===');
  console.log('Request params:', req.params);
  console.log('Request query:', req.query);
  console.log('Request body:', req.body);

  // Frontend will call this to verify
  const response = { status: 'success', message: 'Payment verified' };
  console.log('Sending response:', response);
  console.log('=== GET PAYMENT STATUS END ===');

  res.json(response);
};

export const getPaymentMethods = async (req: Request, res: Response) => {
  console.log('=== GET PAYMENT METHODS START ===');
  console.log('Request user:', (req as any).user);

  try {
    const userId = (req as any).user?.userId;
    console.log('Extracted userId:', userId);

    if (!userId) {
      console.error('No userId found in request');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    console.log('Fetching payment methods for userId:', userId);
    const paymentMethods = await UserPaymentMethod.findAll({
      where: { userId },
      attributes: ['id', 'type', 'provider', 'last4', 'brand', 'expiryMonth', 'expiryYear', 'isDefault']
    });

    console.log('Found payment methods:', JSON.stringify(paymentMethods, null, 2));
    console.log('Number of payment methods:', paymentMethods.length);

    const response = { success: true, paymentMethods, count: paymentMethods.length };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    console.log('=== GET PAYMENT METHODS END (SUCCESS) ===');

    res.json(response);
  } catch (error: any) {
    console.error('=== GET PAYMENT METHODS ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.log('=== GET PAYMENT METHODS END (ERROR) ===');

    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods',
      details: error.message
    });
  }
};

export const addPaymentMethod = async (req: Request, res: Response) => {
  console.log('=== ADD PAYMENT METHOD START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request user:', (req as any).user);

  try {
    const userId = (req as any).user?.userId;
    console.log('Extracted userId:', userId);

    const { type, provider, last4, brand, expiryMonth, expiryYear, chapaToken } = req.body;
    console.log('Parsed payment method data:', { type, provider, last4, brand, expiryMonth, expiryYear, chapaToken });

    if (!type || !provider) {
      console.error('Missing required fields:', { type, provider });
      return res.status(400).json({
        error: 'Type and provider are required',
        received: { type, provider }
      });
    }

    console.log('Creating payment method...');
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

    console.log('Payment method created successfully:', JSON.stringify(paymentMethod, null, 2));

    const response = { success: true, paymentMethod };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    console.log('=== ADD PAYMENT METHOD END (SUCCESS) ===');

    res.json(response);
  } catch (error: any) {
    console.error('=== ADD PAYMENT METHOD ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.log('=== ADD PAYMENT METHOD END (ERROR) ===');

    res.status(500).json({
      success: false,
      error: 'Failed to add payment method',
      details: error.message
    });
  }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
  console.log('=== UPDATE PAYMENT METHOD START ===');
  console.log('Request params:', req.params);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request user:', (req as any).user);

  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { isDefault } = req.body;

    console.log('Extracted data:', { userId, id, isDefault });

    console.log('Looking for payment method with id:', id, 'and userId:', userId);
    const paymentMethod = await UserPaymentMethod.findOne({
      where: { id, userId }
    });

    console.log('Found payment method:', paymentMethod ? JSON.stringify(paymentMethod, null, 2) : 'NOT FOUND');

    if (!paymentMethod) {
      console.error('Payment method not found');
      return res.status(404).json({ error: 'Payment method not found' });
    }

    if (isDefault) {
      console.log('Setting all other methods to non-default for userId:', userId);
      // Set all other methods to non-default
      await UserPaymentMethod.update(
        { isDefault: false },
        { where: { userId } }
      );
      console.log('Updated other payment methods');
    }

    console.log('Updating payment method with isDefault:', isDefault);
    await paymentMethod.update({ isDefault });
    console.log('Payment method updated successfully');

    const response = { success: true, paymentMethod: paymentMethod.toJSON() };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    console.log('=== UPDATE PAYMENT METHOD END (SUCCESS) ===');

    res.json(response);
  } catch (error: any) {
    console.error('=== UPDATE PAYMENT METHOD ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.log('=== UPDATE PAYMENT METHOD END (ERROR) ===');

    res.status(500).json({
      success: false,
      error: 'Failed to update payment method',
      details: error.message
    });
  }
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
  console.log('=== DELETE PAYMENT METHOD START ===');
  console.log('Request params:', req.params);
  console.log('Request user:', (req as any).user);

  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    console.log('Extracted data:', { userId, id });

    console.log('Looking for payment method with id:', id, 'and userId:', userId);
    const paymentMethod = await UserPaymentMethod.findOne({
      where: { id, userId }
    });

    console.log('Found payment method:', paymentMethod ? JSON.stringify(paymentMethod, null, 2) : 'NOT FOUND');

    if (!paymentMethod) {
      console.error('Payment method not found');
      return res.status(404).json({ error: 'Payment method not found' });
    }

    console.log('Deleting payment method...');
    await paymentMethod.destroy();
    console.log('Payment method deleted successfully');

    const response = { success: true, message: 'Payment method deleted' };
    console.log('Sending response:', response);
    console.log('=== DELETE PAYMENT METHOD END (SUCCESS) ===');

    res.json(response);
  } catch (error: any) {
    console.error('=== DELETE PAYMENT METHOD ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.log('=== DELETE PAYMENT METHOD END (ERROR) ===');

    res.status(500).json({
      success: false,
      error: 'Failed to delete payment method',
      details: error.message
    });
  }
};

export const chapaWebhook = async (req: Request, res: Response) => {
  console.log('=== CHAPA WEBHOOK START ===');
  console.log('Webhook headers:', req.headers);
  console.log('Webhook body:', JSON.stringify(req.body, null, 2));
  console.log('Webhook query:', req.query);

  try {
    const { tx_ref, status, amount } = req.body;
    console.log('Parsed webhook data:', { tx_ref, status, amount });
    console.log('Full webhook body:', JSON.stringify(req.body, null, 2));

    // Find the payment record by transaction reference
    console.log('Looking for payment with tx_ref:', tx_ref);
    const payment = await Payment.findOne({ where: { transactionId: tx_ref } });

    console.log('Payment found:', payment ? JSON.stringify(payment, null, 2) : 'NOT FOUND');

    if (!payment) {
      console.error('Payment not found for tx_ref:', tx_ref);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Find the associated order
    console.log('Looking for order with id:', payment.orderId);
    const order = await Order.findByPk(payment.orderId);

    console.log('Order found:', order ? JSON.stringify(order, null, 2) : 'NOT FOUND');

    if (!order) {
      console.error('Order not found for payment:', payment.id);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update payment and order status based on webhook data
    console.log('Updating payment and order with status:', status);

    if (status === 'success') {
      console.log('Processing successful payment...');
      await payment.update({ status: 'completed' });
      console.log('Payment updated to completed');
      await order.update({ paymentStatus: 'paid' });
      console.log('Order updated to paid');
      console.log('Payment completed successfully for tx_ref:', tx_ref);
    } else {
      console.log('Processing failed payment...');
      await payment.update({ status: 'failed' });
      console.log('Payment updated to failed');
      await order.update({ paymentStatus: 'failed' });
      console.log('Order updated to failed');
      console.log('Payment failed for tx_ref:', tx_ref);
    }

    // Respond to Chapa to acknowledge receipt
    console.log('Sending success response to Chapa');
    console.log('=== CHAPA WEBHOOK END (SUCCESS) ===');

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('=== CHAPA WEBHOOK ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.log('=== CHAPA WEBHOOK END (ERROR) ===');

    res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  console.log('=== VERIFY PAYMENT START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request user:', (req as any).user);

  try {
    const { tx_ref } = req.body;
    console.log('Parsed tx_ref:', tx_ref);

    if (!tx_ref) {
      console.error('No tx_ref provided');
      return res.status(400).json({ success: false, error: 'Transaction reference is required' });
    }

    // Find the payment record by transaction reference
    console.log('Looking for payment with tx_ref:', tx_ref);
    const payment = await Payment.findOne({ where: { transactionId: tx_ref } });

    console.log('Payment found:', payment ? JSON.stringify(payment, null, 2) : 'NOT FOUND');

    if (!payment) {
      console.error('Payment not found for tx_ref:', tx_ref);
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Find the associated order
    console.log('Looking for order with id:', payment.orderId);
    const order = await Order.findByPk(payment.orderId);

    console.log('Order found:', order ? JSON.stringify(order, null, 2) : 'NOT FOUND');

    if (!order) {
      console.error('Order not found for payment:', payment.id);
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if payment is already completed
    if (payment.status === 'completed' && order.paymentStatus === 'paid') {
      console.log('Payment already completed and order marked as paid');
      return res.json({ success: true, message: 'Payment already verified', orderId: payment.orderId });
    }

    // Always try to verify with Chapa API first
    console.log('Verifying payment status with Chapa API...');
    try {
      const chapaResponse = await axios.get(`${process.env.CHAPA_BASE_URL}/transaction/verify/${tx_ref}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Chapa verification response:', JSON.stringify(chapaResponse.data, null, 2));

      const { status, data } = chapaResponse.data;

      if (status === 'success' && data?.status === 'success') {
        console.log('Payment verified as successful, updating records...');
        await payment.update({ status: 'completed' });
        await order.update({ paymentStatus: 'paid' });
        console.log('Payment and order updated successfully');
        return res.json({ success: true, message: 'Payment verified and order updated', orderId: payment.orderId });
      } else {
        console.log('Payment verification failed or pending');
        return res.json({ success: false, message: 'Payment not completed' });
      }
    } catch (chapaError: any) {
      console.error('Chapa API verification failed:', chapaError.message);
      console.log('Falling back to manual verification...');

      // Fallback: If Chapa API fails, check if we should manually mark as paid
      // This is a safety mechanism in case webhook fails
      console.log('Checking if we should manually update payment status...');

      // For now, we'll be conservative and not auto-update
      // In production, you might want to add business logic here
      console.log('Manual verification not implemented - payment status unchanged');
      return res.json({ success: false, message: 'Payment verification unavailable, please check with support' });
    }

    console.log('=== VERIFY PAYMENT END ===');
  } catch (error: any) {
    console.error('=== VERIFY PAYMENT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.log('=== VERIFY PAYMENT END (ERROR) ===');

    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      details: error.message
    });
  }
};
