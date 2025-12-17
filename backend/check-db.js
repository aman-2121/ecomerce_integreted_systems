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

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Check users
    const [users] = await sequelize.query('SELECT id, name, email, role FROM users');
    console.log('Users in database:', users.length);
    users.forEach(user => console.log(`- ${user.name} (${user.email}) - ${user.role}`));

    // Check products
    const [products] = await sequelize.query('SELECT id, name FROM products');
    console.log('Products in database:', products.length);

    // Check orders
    const [orders] = await sequelize.query('SELECT id, status FROM orders');
    console.log('Orders in database:', orders.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
