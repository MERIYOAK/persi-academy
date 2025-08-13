const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAdminStats() {
  console.log('Testing admin stats endpoint...\n');

  try {
    // Test 1: Check if endpoint exists (should return 401 without token)
    console.log('Test 1: Checking endpoint without token...');
    const response1 = await fetch('http://localhost:5000/api/admin/stats');
    console.log('Status:', response1.status);
    console.log('Response:', response1.status === 401 ? 'Unauthorized (expected)' : 'Unexpected response');
    console.log('');

    // Test 2: Check with invalid token
    console.log('Test 2: Checking endpoint with invalid token...');
    const response2 = await fetch('http://localhost:5000/api/admin/stats', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    console.log('Status:', response2.status);
    console.log('Response:', response2.status === 401 ? 'Unauthorized (expected)' : 'Unexpected response');
    console.log('');

    // Test 3: Check if admin login endpoint exists
    console.log('Test 3: Checking admin login endpoint...');
    const response3 = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    console.log('Status:', response3.status);
    
    if (response3.ok) {
      const data = await response3.json();
      console.log('Login successful!');
      console.log('Token received:', data.token ? 'Yes' : 'No');
      
      // Test 4: Use the token to access admin stats
      console.log('\nTest 4: Testing admin stats with valid token...');
      const response4 = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      console.log('Status:', response4.status);
      
      if (response4.ok) {
        const statsData = await response4.json();
        console.log('Admin stats retrieved successfully!');
        console.log('Stats data:', JSON.stringify(statsData, null, 2));
      } else {
        const errorData = await response4.json();
        console.log('Failed to get admin stats:', errorData);
      }
    } else {
      const errorData = await response3.json();
      console.log('Login failed:', errorData);
      console.log('\nThis might be because:');
      console.log('1. .env file is missing or not configured properly');
      console.log('2. ADMIN_EMAIL and ADMIN_PASSWORD_HASH are not set');
      console.log('3. MongoDB is not running');
    }

  } catch (error) {
    console.error('Error testing admin stats:', error.message);
    console.log('\nMake sure:');
    console.log('1. The server is running on port 5000');
    console.log('2. MongoDB is connected');
    console.log('3. .env file is properly configured');
  }
}

testAdminStats(); 