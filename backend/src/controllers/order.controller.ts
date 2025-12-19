import { Request, Response } from 'express';
import { Order, OrderItem, Product, User, Payment } from '../models';
import { PaymentService } from '../services/payment.service';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  console.log('=== CREATE ORDER START ===');
  console.log('User:', (req as any).user);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const userId = (req as any).user?.userId;
    const { items, shippingAddress, totalAmount } = req.body;

    // Validate input
    const missingFields = [];
    if (!items) missingFields.push('items');
    if (!shippingAddress) missingFields.push('shippingAddress');
    if (totalAmount === undefined || totalAmount === null) missingFields.push('totalAmount');

    if (missingFields.length > 0) {
      console.error('Validation failed. Missing fields:', missingFields);
      res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        received: req.body
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error('Validation failed. Items must be non-empty array');
      res.status(400).json({ error: 'Items array is required and must not be empty' });
      return;
    }

    // Validate specific item fields
    for (const [index, item] of items.entries()) {
      if (!item.productId || typeof item.productId !== 'number' || item.productId <= 0) {
        console.error(`Validation failed at index ${index}. Invalid productId:`, item.productId);
        res.status(400).json({ error: `Invalid productId at index ${index}: ${item.productId}` });
        return;
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.error(`Validation failed at index ${index}. Invalid quantity:`, item.quantity);
        res.status(400).json({ error: `Invalid quantity at index ${index}: ${item.quantity}` });
        return;
      }
    }

    console.log('Validation passed. Checking product stock...');

    // Validate items and stock
    for (const item of items) {
      let product;
      try {
        product = await Product.findByPk(item.productId);
      } catch (dbError) {
        console.error('Database error finding product:', dbError);
        res.status(500).json({ error: 'Database error occurred while validating products' });
        return;
      }
      if (!product) {
        console.error(`Product not found: ${item.productId}`);
        res.status(400).json({ error: `Product ${item.productId} not found` });
        return;
      }
      if (product.stock < item.quantity) {
        console.error(`Insufficient stock for ${product.name}. Required: ${item.quantity}, Available: ${product.stock}`);
        res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        return;
      }
    }

    console.log('Stock check passed. Creating order...');

    // Create order
    let order;
    try {
      // Get user details for customer info
      let customerName: string | undefined = undefined;
      let customerEmail: string | undefined = undefined;
      if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          customerName = user.name;
          customerEmail = user.email;
        }
      }

      order = await Order.create({
        userId,
        totalAmount,
        shippingAddress,
        status: 'pending',
        paymentStatus: 'pending',
        customerName,
        customerEmail
      });
      console.log('Order created successfully:', order.id);
    } catch (createError: any) {
      console.error('Order creation failed:', createError);
      res.status(500).json({
        error: 'Failed to create order record',
        details: createError.message
      });
      return;
    }

    // Create order items and reduce stock
    console.log('Creating order items...');
    for (const item of items) {
      let product;
      try {
        product = await Product.findByPk(item.productId);
        if (product) {
          await OrderItem.create({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price
          });

          await product.update({
            stock: product.stock - item.quantity
          });
        }
      } catch (itemError) {
        console.error(`Failed to process item ${item.productId} for order ${order.id}:`, itemError);
        // Continue but log heavily - in real world might want transaction rollback
      }
    }
    console.log('Order items created successfully');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
    console.log('=== CREATE ORDER END (SUCCESS) ===');
  } catch (error: any) {
    console.error('=== CREATE ORDER FATAL ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error during order creation',
      details: error.message
    });
  }
};

export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    // Check for any pending payments in the background
    checkAndUpdatePendingPayments(userId);

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image']
            }
          ]
        }
      ]
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    await order.update({ status });
    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkUpdateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  console.log('=== BULK STATUS UPDATE START ===');
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Order IDs array is required' });
      return;
    }

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    await Order.update({ status }, {
      where: {
        id: ids
      }
    });

    res.json({
      message: `Successfully updated ${ids.length} orders to ${status}`,
      updatedCount: ids.length
    });

    console.log(`Bulk update success: ${ids.length} orders set to ${status}`);
    console.log('=== BULK STATUS UPDATE END ===');
  } catch (error) {
    console.error('Bulk update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for any pending payments in the background
    checkAndUpdateAllPendingPayments();

    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check and update pending payments for a specific user
async function checkAndUpdatePendingPayments(userId: number) {
  try {
    console.log('Checking pending payments for user:', userId);

    // Find orders with pending payment status for this user
    const pendingOrders = await Order.findAll({
      where: { userId, paymentStatus: 'pending' },
      include: [{ model: Payment }]
    });

    console.log('Found pending orders:', pendingOrders.length);

    for (const order of pendingOrders) {
      const orderWithPayments = order as any;
      if (orderWithPayments.Payments && orderWithPayments.Payments.length > 0 && orderWithPayments.Payments[0].transactionId) {
        try {
          // Verify payment status with Chapa API
          const chapaResponse = await PaymentService.verifyChapaPayment(orderWithPayments.Payments[0].transactionId);

          if (chapaResponse.status === 'success') {
            console.log('Updating order and payment to paid for tx_ref:', orderWithPayments.Payments[0].transactionId);
            await order.update({ paymentStatus: 'paid' });
            await orderWithPayments.Payments[0].update({ status: 'completed' });
          }
        } catch (error) {
          console.error('Error verifying payment for tx_ref:', orderWithPayments.Payments[0].transactionId, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndUpdatePendingPayments:', error);
  }
}

// Helper function to check and update all pending payments (for admin)
async function checkAndUpdateAllPendingPayments() {
  try {
    console.log('Checking all pending payments');

    // Find all orders with pending payment status
    const pendingOrders = await Order.findAll({
      where: { paymentStatus: 'pending' },
      include: [{ model: Payment }]
    });

    console.log('Found pending orders:', pendingOrders.length);

    for (const order of pendingOrders) {
      if (order.Payments && order.Payments.length > 0 && order.Payments[0].transactionId) {
        try {
          // Verify payment status with Chapa API
          const chapaResponse = await PaymentService.verifyChapaPayment(order.Payments[0].transactionId);

          if (chapaResponse.status === 'success') {
            console.log('Updating order and payment to paid for tx_ref:', order.Payments[0].transactionId);
            await order.update({ paymentStatus: 'paid' });
            await order.Payments[0].update({ status: 'completed' });
          }
        } catch (error) {
          console.error('Error verifying payment for tx_ref:', order.Payments[0].transactionId, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndUpdateAllPendingPayments:', error);
  }
}
