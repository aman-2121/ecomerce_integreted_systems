const axios = require('axios');

async function loginAdmin() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'amanuelneby@gmail.com',
      password: 'admin123'
    });

    console.log('Login successful!');
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user);

    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return null;
  }
}

loginAdmin();
