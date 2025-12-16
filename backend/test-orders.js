const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false
  }
);

async function checkOrders() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    const [orders] = await sequelize.query('SELECT id, "userId", "totalAmount", "paymentStatus", "status", "createdAt" FROM orders LIMIT 5');
    console.log('Orders found:', orders.length);
    orders.forEach(order => console.log('Order:', JSON.stringify(order, null, 2)));

    const [payments] = await sequelize.query('SELECT id, "orderId", "transactionId", status FROM payments LIMIT 5');
    console.log('Payments found:', payments.length);
    payments.forEach(payment => console.log('Payment:', JSON.stringify(payment, null, 2)));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkOrders();
