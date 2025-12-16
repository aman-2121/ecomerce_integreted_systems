const axios = require('axios');

async function testPaymentStatusUpdate() {
  try {
    console.log('=== TESTING PAYMENT STATUS UPDATE ===');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'amanuelneby@gmail.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful, token received');

    // Step 2: Get current dashboard stats
    console.log('2. Getting current dashboard stats...');
    const statsResponse = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Current revenue:', statsResponse.data.totalRevenue);
    console.log('Total orders:', statsResponse.data.totalOrders);

    // Step 3: Update payment status for order ID 1
    console.log('3. Updating payment status for order ID 1...');
    const updateResponse = await axios.patch('http://localhost:5000/api/admin/orders/payment-status',
      {
        orderId: 1,
        paymentStatus: 'paid'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    console.log('✅ Payment status update response:', updateResponse.data);

    // Step 4: Get updated dashboard stats
    console.log('4. Getting updated dashboard stats...');
    const updatedStatsResponse = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Updated revenue:', updatedStatsResponse.data.totalRevenue);
    console.log('Updated total orders:', updatedStatsResponse.data.totalOrders);

    // Step 5: Verify the order was updated
    console.log('5. Verifying order status in database...');
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

    const [orders] = await sequelize.query('SELECT id, "paymentStatus", "totalAmount" FROM orders WHERE id = 1');
    console.log('Order 1 status:', orders[0]);

    await sequelize.close();

    console.log('=== TEST COMPLETED SUCCESSFULLY ===');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPaymentStatusUpdate();
