import User from './user.model';
import Product from './product.model';
import Order from './order.model';
import Payment from './payment.model';
import Category from './category.model';
import UserActivityLog from './userActivityLog.model';
import SystemSettings from './systemSettings.model';
import Banner from './banner.model';
import StaticPage from './staticPage.model';
import EmailTemplate from './emailTemplate.model';
import UserPaymentMethod from './userPaymentMethod.model';
import OrderItem from './orderItem.model';

// Define associations
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(Payment, { foreignKey: 'orderId' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(UserActivityLog, { foreignKey: 'userId' });
UserActivityLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserPaymentMethod, { foreignKey: 'userId' });
UserPaymentMethod.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export { User, Product, Order, Payment, Category, UserActivityLog, SystemSettings, Banner, StaticPage, EmailTemplate, UserPaymentMethod, OrderItem };
