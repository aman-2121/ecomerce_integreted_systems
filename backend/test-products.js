const axios = require('axios');

async function testProducts() {
  try {
    // First login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, token obtained');

    // Test getting all products
    const productsResponse = await axios.get('http://localhost:5000/api/admin/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Products response:');
    console.log(`Total products: ${productsResponse.data.products?.length || 0}`);
    if (productsResponse.data.products?.length > 0) {
      console.log('First product:', productsResponse.data.products[0]);
    }

    // Test top selling products
    const topProductsResponse = await axios.get('http://localhost:5000/api/admin/top-selling-products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Top selling products response:');
    console.log(`Total top products: ${topProductsResponse.data.topProducts?.length || 0}`);
    if (topProductsResponse.data.topProducts?.length > 0) {
      console.log('First top product:', topProductsResponse.data.topProducts[0]);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testProducts();
