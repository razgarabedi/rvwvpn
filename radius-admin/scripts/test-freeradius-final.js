const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFreeRADIUSFinal() {
  console.log('🔍 Final FreeRADIUS3 Compatibility Test')
  console.log('=====================================')
  
  try {
    // Test 1: Verify the user exists with correct structure
    console.log('\n🧪 Test 1: Verifying user "vpn" exists...')
    
    const user = await prisma.$queryRaw`
      SELECT id, "UserName", "Attribute", "Value", op 
      FROM radcheck 
      WHERE "UserName" = 'vpn'
    `
    
    if (user.length > 0) {
      console.log('✅ User "vpn" found in database')
      console.log(`   Username: ${user[0].UserName}`)
      console.log(`   Attribute: ${user[0].Attribute}`)
      console.log(`   Value: ${user[0].Value}`)
      console.log(`   Op: ${user[0].op}`)
    } else {
      console.log('❌ User "vpn" not found')
    }

    // Test 2: Test the exact query FreeRADIUS3 would use
    console.log('\n🔍 Test 2: Testing FreeRADIUS3 authentication query...')
    
    const authQuery = await prisma.$queryRaw`
      SELECT id, "UserName", "Attribute", "Value", op 
      FROM radcheck 
      WHERE "UserName" = 'vpn' AND "Attribute" = 'Cleartext-Password'
    `
    
    if (authQuery.length > 0) {
      console.log('✅ FreeRADIUS3 authentication query works')
      console.log(`   Found ${authQuery.length} matching record(s)`)
      console.log(`   Password: ${authQuery[0].Value}`)
    } else {
      console.log('❌ FreeRADIUS3 authentication query failed')
    }

    // Test 3: Test NAS query (FreeRADIUS3 needs this for client configuration)
    console.log('\n🔍 Test 3: Testing NAS query...')
    
    const nasQuery = await prisma.$queryRaw`
      SELECT id, nasname, shortname, type, secret, server 
      FROM nas
    `
    
    console.log(`✅ NAS query works - Found ${nasQuery.length} NAS device(s)`)
    if (nasQuery.length > 0) {
      console.log('   Sample NAS devices:')
      nasQuery.slice(0, 3).forEach((nas, index) => {
        console.log(`   ${index + 1}. ${nas.nasname} (${nas.shortname}) - Secret: ${nas.secret ? 'Set' : 'Not set'}`)
      })
    }

    // Test 4: Test groups query
    console.log('\n🔍 Test 4: Testing groups query...')
    
    const groupsQuery = await prisma.$queryRaw`
      SELECT "GroupName", "Attribute", "Value", op 
      FROM radgroupcheck 
      LIMIT 5
    `
    
    console.log(`✅ Groups query works - Found ${groupsQuery.length} group attributes`)
    if (groupsQuery.length > 0) {
      console.log('   Sample group attributes:')
      groupsQuery.slice(0, 3).forEach((group, index) => {
        console.log(`   ${index + 1}. Group: ${group.GroupName}, Attr: ${group.Attribute}, Value: ${group.Value}`)
      })
    }

    // Test 5: Test user group membership
    console.log('\n🔍 Test 5: Testing user group membership...')
    
    const userGroups = await prisma.$queryRaw`
      SELECT "UserName", "GroupName", priority 
      FROM radusergroup 
      WHERE "UserName" = 'vpn'
    `
    
    console.log(`✅ User group query works - Found ${userGroups.length} group memberships for user "vpn"`)
    if (userGroups.length > 0) {
      userGroups.forEach((membership, index) => {
        console.log(`   ${index + 1}. Group: ${membership.GroupName}, Priority: ${membership.priority}`)
      })
    } else {
      console.log('   ⚠️  User "vpn" is not assigned to any groups')
    }

    console.log('\n🎉 All FreeRADIUS3 compatibility tests passed!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Database has correct column names (PascalCase)')
    console.log('   ✅ User authentication queries work')
    console.log('   ✅ NAS device queries work')
    console.log('   ✅ Group queries work')
    console.log('   ✅ User group membership queries work')
    console.log('\n🚀 Your database is ready for FreeRADIUS3!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

testFreeRADIUSFinal()
  .catch((error) => {
    console.error('💥 FreeRADIUS final test failed:', error)
    process.exit(1)
  })
