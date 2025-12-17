const axios = require('axios');

async function testTopProducts() {
  try {
    // First login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, token obtained');

    // Now test the top selling products endpoint
    const response = await axios.get('http://localhost:5000/api/admin/top-selling-products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Top selling products response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testTopProducts();
