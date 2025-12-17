import { Request, Response } from 'express';
import { User, Order, Product, Category, UserActivityLog, SystemSettings, Banner, StaticPage, EmailTemplate } from '../models';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total users count
    const totalUsers = await User.count();

    // Get total orders count
    const totalOrders = await Order.count();

    // Get total products count
    const totalProducts = await Product.count();

    // Get total revenue (sum of all paid orders)
    const totalRevenueResult = await Order.sum('totalAmount', {
      where: { paymentStatus: 'paid' }
    });
    const totalRevenue = totalRevenueResult || 0;

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      res.status(400).json({ error: 'Cannot delete admin user' });
      return;
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Category management functions
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, image } = req.body;

    const category = await Category.create({
      name,
      description,
      image
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('Create category error:', error);
    if ((error as Error).name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Category name already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await category.update({
      name,
      description,
      image
    });

    res.json({ category });
  } catch (error) {
    console.error('Update category error:', error);
    if ((error as Error).name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Category name already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check if category has associated products
    const productCount = await Product.count({
      where: { categoryId: category.id }
    });

    if (productCount > 0) {
      res.status(400).json({ error: 'Cannot delete category with associated products' });
      return;
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Analytics functions
export const getRevenueAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let groupBy: any;

    switch (period) {
      case 'daily':
        groupBy = sequelize.fn('DATE', sequelize.col('createdAt'));
        break;
      case 'weekly':
        groupBy = sequelize.fn('YEARWEEK', sequelize.col('createdAt'));
        break;
      case 'monthly':
      default:
        groupBy = sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m');
        break;
    }

    const whereClause: any = { status: 'delivered' };
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    const revenueData = await Order.findAll({
      attributes: [
        [groupBy, 'period'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
      ],
      where: whereClause,
      group: [groupBy],
      order: [[groupBy, 'ASC']],
      raw: true
    });

    res.json({ revenueData });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTopSellingProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND o."createdAt" BETWEEN '${startDate}' AND '${endDate}'`;
    }

    const topProducts = await sequelize.query(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.image,
        p.stock,
        SUM(oi.quantity) as salesCount,
        SUM(oi.quantity * oi."unitPrice") as totalRevenue
      FROM products p
      INNER JOIN order_items oi ON p.id = oi."productId"
      INNER JOIN orders o ON oi."orderId" = o.id ${dateFilter}
      WHERE o."paymentStatus" = 'paid' AND (o.status IS NULL OR o.status != 'cancelled')
      GROUP BY p.id, p.name, p.price, p.image, p.stock
      ORDER BY salesCount DESC, p.name ASC
      LIMIT ${parseInt(limit as string)}
    `, {
      type: QueryTypes.SELECT
    });

    res.json({ topProducts });
  } catch (error) {
    console.error('Get top selling products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCustomerAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'monthly' } = req.query;

    let dateFormat: string;
    let groupBy: any;

    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        groupBy = sequelize.fn('DATE', sequelize.col('createdAt'));
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        groupBy = sequelize.fn('YEARWEEK', sequelize.col('createdAt'));
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
        groupBy = sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m');
        break;
    }

    const newCustomers = await User.findAll({
      attributes: [
        [groupBy, 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'newCustomers']
      ],
      where: { role: 'customer' },
      group: [groupBy],
      order: [[groupBy, 'ASC']],
      raw: true
    });

    // Get total customers
    const totalCustomers = await User.count({
      where: { role: 'customer' }
    });

    // Get active customers (orders in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomers = await User.count({
      where: {
        role: 'customer',
        createdAt: { [Op.lt]: thirtyDaysAgo }
      },
      include: [{
        model: Order,
        where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
        required: true
      }]
    });

    res.json({
      newCustomers,
      totalCustomers,
      activeCustomers
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderStatusDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderStatusData = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({ orderStatusData });
  } catch (error) {
    console.error('Get order status distribution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User management functions
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await user.update({ role });
    res.json({ user: { ...user.toJSON(), password: undefined } });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserOrderHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const orders = await Order.findAll({
      where: { userId: id },
      order: [['createdAt', 'DESC']]
    });

    const totalSpent = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);

    res.json({
      user,
      orders,
      totalSpent,
      orderCount: orders.length
    });
  } catch (error) {
    console.error('Get user order history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, limit = 50 } = req.query;

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    }

    const activityLogs = await UserActivityLog.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string)
    });

    res.json({ activityLogs });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Content management functions
export const getAllBanners = async (req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ banners });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, image, link } = req.body;

    const banner = await Banner.create({
      title,
      description,
      image,
      link
    });

    res.status(201).json({ banner });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, image, link, isActive } = req.body;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      res.status(404).json({ error: 'Banner not found' });
      return;
    }

    await banner.update({
      title,
      description,
      image,
      link,
      isActive
    });

    res.json({ banner });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      res.status(404).json({ error: 'Banner not found' });
      return;
    }

    await banner.destroy();
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllStaticPages = async (req: Request, res: Response): Promise<void> => {
  try {
    const pages = await StaticPage.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ pages });
  } catch (error) {
    console.error('Get static pages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createStaticPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, slug, content, isPublished } = req.body;

    const page = await StaticPage.create({
      title,
      slug,
      content,
      isPublished
    });

    res.status(201).json({ page });
  } catch (error) {
    console.error('Create static page error:', error);
    if ((error as Error).name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Page slug already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateStaticPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, slug, content, isPublished } = req.body;

    const page = await StaticPage.findByPk(id);
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    await page.update({
      title,
      slug,
      content,
      isPublished
    });

    res.json({ page });
  } catch (error) {
    console.error('Update static page error:', error);
    if ((error as Error).name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Page slug already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteStaticPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const page = await StaticPage.findByPk(id);
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    await page.destroy();
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Delete static page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllEmailTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await EmailTemplate.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ templates });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEmailTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, subject, body, variables } = req.body;

    const template = await EmailTemplate.create({
      name,
      subject,
      body,
      variables
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error('Create email template error:', error);
    if ((error as Error).name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Template name already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEmailTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, subject, body, variables, isActive } = req.body;

    const template = await EmailTemplate.findByPk(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    await template.update({
      name,
      subject,
      body,
      variables,
      isActive
    });

    res.json({ template });
  } catch (error) {
    console.error('Update email template error:', error);
    if ((error as Error).name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Template name already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEmailTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await EmailTemplate.findByPk(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    await template.destroy();
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// System settings functions
export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await SystemSettings.findAll();
    res.json({ settings });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value, category = 'general', isPublic = false } = req.body;

    let setting = await SystemSettings.findOne({ where: { key } });

    if (setting) {
      await setting.update({ value });
    } else {
      setting = await SystemSettings.create({ key, value, category, isPublic });
    }

    res.json({ setting });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk operations
export const bulkUpdateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({ error: 'Order IDs array is required' });
      return;
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const [affectedRows] = await Order.update(
      { status },
      {
        where: { id: { [Op.in]: orderIds } }
      }
    );

    res.json({
      message: `${affectedRows} orders updated successfully`,
      affectedRows
    });
  } catch (error) {
    console.error('Bulk update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status } = req.query;

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    // In a real app, you'd generate CSV/Excel here
    // For now, just return the data
    res.json({ orders });
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Low stock products function
export const getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 3;

    const lowStockProducts = await Product.findAll({
      where: {
        stock: {
          [Op.lte]: threshold
        }
      },
      order: [['stock', 'ASC']]
    });

    res.json({ lowStockProducts });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update product stock function
export const updateProductStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'Invalid stock value' });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await product.update({ stock });
    res.json({ product });
  } catch (error) {
    console.error('Update product stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Manual payment status update for testing/admin purposes
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, paymentStatus } = req.body;

    if (!orderId || !paymentStatus) {
      res.status(400).json({ error: 'Order ID and payment status are required' });
      return;
    }

    const validStatuses = ['pending', 'paid', 'failed'];
    if (!validStatuses.includes(paymentStatus)) {
      res.status(400).json({ error: 'Invalid payment status' });
      return;
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    await order.update({ paymentStatus });
    res.json({ order });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
