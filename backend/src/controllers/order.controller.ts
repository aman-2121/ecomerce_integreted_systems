import { Request, Response } from 'express';
import { Order, OrderItem, Product, User } from '../models';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { items, shippingAddress, totalAmount } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items array is required and must not be empty' });
      return;
    }

    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'number' || item.productId <= 0) {
        res.status(400).json({ error: `Invalid productId: ${item.productId}` });
        return;
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({ error: `Invalid quantity: ${item.quantity}` });
        return;
      }
    }

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
        res.status(400).json({ error: `Product ${item.productId} not found` });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        return;
      }
    }

    // Create order
    const order = await Order.create({
      userId,
      totalAmount,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Create order items and reduce stock
    for (const item of items) {
      let product;
      try {
        product = await Product.findByPk(item.productId);
      } catch (dbError) {
        console.error('Database error finding product for order item:', dbError);
        // Continue processing other items, but log the error
        continue;
      }
      if (product) {
        // Create order item
        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price
        });

        // Reduce stock
        await product.update({
          stock: product.stock - item.quantity
        });
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
