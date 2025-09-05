// Test script to verify the RADIUS user management API endpoints
const baseUrl = 'http://localhost:3000'

async function testAPI() {
  console.log('🧪 Testing RADIUS User Management API...')
  console.log('')

  try {
    // Test 1: Get all users (should work even with empty database)
    console.log('1. Testing GET /api/radius/users')
    const getResponse = await fetch(`${baseUrl}/api/radius/users`)
    console.log(`   Status: ${getResponse.status}`)
    
    if (getResponse.ok) {
      const users = await getResponse.json()
      console.log(`   ✅ Success: Found ${users.length} users`)
    } else {
      console.log(`   ❌ Failed: ${getResponse.status}`)
    }
    console.log('')

    // Test 2: Create a new user
    console.log('2. Testing POST /api/radius/users')
    const createResponse = await fetch(`${baseUrl}/api/radius/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpassword123'
      })
    })
    console.log(`   Status: ${createResponse.status}`)
    
    if (createResponse.ok) {
      const newUser = await createResponse.json()
      console.log(`   ✅ Success: Created user with ID ${newUser.id}`)
      console.log(`   Username: ${newUser.username}`)
      console.log(`   Attribute: ${newUser.attribute}`)
      
      // Test 3: Update the user
      console.log('')
      console.log('3. Testing PUT /api/radius/users/[id]')
      const updateResponse = await fetch(`${baseUrl}/api/radius/users/${newUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser_updated',
          password: 'newpassword123'
        })
      })
      console.log(`   Status: ${updateResponse.status}`)
      
      if (updateResponse.ok) {
        const updatedUser = await updateResponse.json()
        console.log(`   ✅ Success: Updated user`)
        console.log(`   New Username: ${updatedUser.username}`)
        
        // Test 4: Delete the user
        console.log('')
        console.log('4. Testing DELETE /api/radius/users/[id]')
        const deleteResponse = await fetch(`${baseUrl}/api/radius/users/${newUser.id}`, {
          method: 'DELETE'
        })
        console.log(`   Status: ${deleteResponse.status}`)
        
        if (deleteResponse.ok) {
          console.log(`   ✅ Success: Deleted user`)
        } else {
          console.log(`   ❌ Failed: ${deleteResponse.status}`)
        }
      } else {
        console.log(`   ❌ Failed: ${updateResponse.status}`)
      }
    } else {
      console.log(`   ❌ Failed: ${createResponse.status}`)
    }

    console.log('')
    console.log('🎉 API testing completed!')
    console.log('')
    console.log('Note: These tests require:')
    console.log('1. The application to be running (npm run dev)')
    console.log('2. A valid database connection')
    console.log('3. Authentication (you may need to be logged in)')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('')
    console.log('Make sure the application is running:')
    console.log('  npm run dev')
    console.log('')
    console.log('And that you have a valid database connection configured.')
  }
}

// Run the test
testAPI()
