// Test script to verify the FreeRADIUS server configuration API endpoints
const baseUrl = 'http://localhost:3000'

async function testServerAPI() {
  console.log('🧪 Testing FreeRADIUS Server Configuration API...')
  console.log('')

  try {
    // Test 1: Get all server configurations
    console.log('1. Testing GET /api/radius/servers')
    const getResponse = await fetch(`${baseUrl}/api/radius/servers`)
    console.log(`   Status: ${getResponse.status}`)
    
    if (getResponse.ok) {
      const servers = await getResponse.json()
      console.log(`   ✅ Success: Found ${servers.length} server configurations`)
      servers.forEach(server => {
        console.log(`      - ${server.name}: ${server.host}:${server.port} (${server.isActive ? 'Active' : 'Inactive'})`)
      })
    } else {
      console.log(`   ❌ Failed: ${getResponse.status}`)
    }
    console.log('')

    // Test 2: Create a new server configuration
    console.log('2. Testing POST /api/radius/servers')
    const createResponse = await fetch(`${baseUrl}/api/radius/servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test RADIUS Server',
        host: '192.168.1.200',
        port: 1813,
        secret: 'testsecret123',
        description: 'Test server configuration',
        isActive: true
      })
    })
    console.log(`   Status: ${createResponse.status}`)
    
    if (createResponse.ok) {
      const newServer = await createResponse.json()
      console.log(`   ✅ Success: Created server configuration with ID ${newServer.id}`)
      console.log(`   Name: ${newServer.name}`)
      console.log(`   Host: ${newServer.host}:${newServer.port}`)
      console.log(`   Active: ${newServer.isActive}`)
      
      // Test 3: Update the server configuration
      console.log('')
      console.log('3. Testing PUT /api/radius/servers/[id]')
      const updateResponse = await fetch(`${baseUrl}/api/radius/servers/${newServer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Test RADIUS Server',
          host: '192.168.1.201',
          port: 1812,
          secret: 'updatedsecret123',
          description: 'Updated test server configuration',
          isActive: false
        })
      })
      console.log(`   Status: ${updateResponse.status}`)
      
      if (updateResponse.ok) {
        const updatedServer = await updateResponse.json()
        console.log(`   ✅ Success: Updated server configuration`)
        console.log(`   New Name: ${updatedServer.name}`)
        console.log(`   New Host: ${updatedServer.host}:${updatedServer.port}`)
        console.log(`   New Active: ${updatedServer.isActive}`)
        
        // Test 4: Delete the server configuration
        console.log('')
        console.log('4. Testing DELETE /api/radius/servers/[id]')
        const deleteResponse = await fetch(`${baseUrl}/api/radius/servers/${newServer.id}`, {
          method: 'DELETE'
        })
        console.log(`   Status: ${deleteResponse.status}`)
        
        if (deleteResponse.ok) {
          console.log(`   ✅ Success: Deleted server configuration`)
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
    console.log('🎉 Server configuration API testing completed!')
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
testServerAPI()
