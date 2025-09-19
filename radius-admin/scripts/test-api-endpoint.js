const fetch = require('node-fetch')

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testing API Endpoint for User Groups\n')

    // Test the API endpoint directly
    const testUsername = 'testuser'
    const baseUrl = 'http://localhost:3000' // Adjust if needed
    
    console.log(`1. Testing GET /api/radius/users/${testUsername}/groups`)
    
    try {
      const response = await fetch(`${baseUrl}/api/radius/users/${encodeURIComponent(testUsername)}/groups`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
      } else {
        const errorText = await response.text()
        console.log('Error response:', errorText)
      }
    } catch (error) {
      console.log('Fetch error (this is expected if server is not running):', error.message)
    }

    console.log('\n2. Testing with a user that should have groups...')
    
    // First, let's create a test user and group
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      // Create test group
      await prisma.radGroupCheck.create({
        data: {
          groupname: 'api-test-group',
          attribute: 'Auth-Type',
          op: ':=',
          value: 'Accept'
        }
      })
      console.log('✅ Test group created')

      // Create test user
      await prisma.radCheck.create({
        data: {
          username: 'apitestuser',
          attribute: 'Cleartext-Password',
          op: ':=',
          value: 'testpass123'
        }
      })
      console.log('✅ Test user created')

      // Assign user to group
      await prisma.radUserGroup.create({
        data: {
          username: 'apitestuser',
          groupname: 'api-test-group',
          priority: 1
        }
      })
      console.log('✅ User assigned to group')

      // Test the API endpoint
      const response = await fetch(`${baseUrl}/api/radius/users/apitestuser/groups`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        console.log('✅ API endpoint working correctly!')
      } else {
        const errorText = await response.text()
        console.log('Error response:', errorText)
      }

      // Cleanup
      await prisma.radUserGroup.deleteMany({
        where: { username: 'apitestuser' }
      })
      await prisma.radCheck.deleteMany({
        where: { username: 'apitestuser' }
      })
      await prisma.radGroupCheck.deleteMany({
        where: { groupname: 'api-test-group' }
      })
      console.log('✅ Test data cleaned up')

    } catch (error) {
      console.error('Database error:', error)
    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAPIEndpoint()
