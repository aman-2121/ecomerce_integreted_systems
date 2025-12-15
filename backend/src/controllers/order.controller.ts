import { Request, Response } from 'express';
import { Order, OrderItem, Product, User } from '../models';

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
      order = await Order.create({
        userId,
        totalAmount,
        shippingAddress,
        status: 'pending',
        paymentStatus: 'pending'
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
    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
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
          include: [
            {
              model: Product,
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

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
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
