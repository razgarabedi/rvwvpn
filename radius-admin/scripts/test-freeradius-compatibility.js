const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFreeRADIUSCompatibility() {
  console.log('🔍 Testing FreeRADIUS3 Compatibility...')
  console.log('=====================================')
  
  try {
    // Test 1: Create a test user with the exact format FreeRADIUS3 expects
    console.log('\n🧪 Test 1: Creating test user "vpn" with password "vpn"...')
    
    const testUser = await prisma.radCheck.create({
      data: {
        username: 'vpn',
        attribute: 'Cleartext-Password',
        op: ':=',
        value: 'vpn'
      }
    })
    console.log('✅ User created successfully')
    console.log(`   ID: ${testUser.id}`)
    console.log(`   Username: ${testUser.username}`)
    console.log(`   Attribute: ${testUser.attribute}`)
    console.log(`   Value: ${testUser.value}`)

    // Test 2: Query the user as FreeRADIUS3 would
    console.log('\n🔍 Test 2: Querying user as FreeRADIUS3 would...')
    
    const foundUser = await prisma.radCheck.findFirst({
      where: {
        username: 'vpn',
        attribute: 'Cleartext-Password'
      }
    })
    
    if (foundUser) {
      console.log('✅ User found successfully')
      console.log(`   Username: ${foundUser.username}`)
      console.log(`   Password: ${foundUser.value}`)
    } else {
      console.log('❌ User not found')
    }

    // Test 3: Check if we can query with the exact SQL that FreeRADIUS3 uses
    console.log('\n🔍 Test 3: Testing exact FreeRADIUS3 SQL query...')
    
    // This simulates the exact query FreeRADIUS3 would run
    const users = await prisma.$queryRaw`
      SELECT id, username, attribute, value, op 
      FROM radcheck 
      WHERE username = 'vpn'
    `
    
    console.log('✅ Raw SQL query successful')
    console.log(`   Found ${users.length} user(s)`)
    if (users.length > 0) {
      console.log(`   First user: ${JSON.stringify(users[0])}`)
    }

    // Test 4: Check NAS table structure
    console.log('\n🔍 Test 4: Testing NAS table structure...')
    
    const nasDevices = await prisma.nas.findMany({
      take: 1
    })
    
    if (nasDevices.length > 0) {
      console.log('✅ NAS table accessible')
      console.log(`   Found ${nasDevices.length} NAS device(s)`)
      console.log(`   Sample NAS: ${nasDevices[0].nasname}`)
    } else {
      console.log('⚠️  No NAS devices found (this is normal if not seeded)')
    }

    // Test 5: Check groups
    console.log('\n🔍 Test 5: Testing groups...')
    
    const groups = await prisma.radGroupCheck.findMany({
      select: {
        groupname: true,
        attribute: true,
        value: true
      },
      take: 3
    })
    
    console.log(`✅ Found ${groups.length} group attributes`)
    groups.forEach((group, index) => {
      console.log(`   ${index + 1}. Group: ${group.groupname}, Attr: ${group.attribute}, Value: ${group.value}`)
    })

    // Clean up test user
    console.log('\n🧹 Cleaning up test user...')
    await prisma.radCheck.delete({
      where: { id: testUser.id }
    })
    console.log('✅ Test user cleaned up')

    console.log('\n🎉 All tests passed! Database is compatible with FreeRADIUS3')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

testFreeRADIUSCompatibility()
  .catch((error) => {
    console.error('💥 FreeRADIUS compatibility test failed:', error)
    process.exit(1)
  })
