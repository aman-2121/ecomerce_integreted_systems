const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
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

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Check if the user amanuelneby@gmail.com exists
    const [existingUser] = await sequelize.query(`
      SELECT id, name, email, role FROM users WHERE email = 'amanuelneby@gmail.com'
    `);

    if (existingUser.length > 0) {
      // Update existing user to admin role
      await sequelize.query(`
        UPDATE users SET role = 'admin' WHERE email = 'amanuelneby@gmail.com'
      `);
      console.log('Updated existing user to admin role!');
      console.log('Email: amanuelneby@gmail.com');
      console.log('Role: admin');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await sequelize.query(`
        INSERT INTO users (name, email, password, role, "createdAt", "updatedAt")
        VALUES ('Admin User', 'admin@example.com', '${hashedPassword}', 'admin', NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `);
      console.log('Admin user created successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    }

  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();
