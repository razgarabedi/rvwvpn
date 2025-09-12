const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure...')
  console.log('================================')
  
  try {
    // Check if we can query with lowercase field names
    console.log('\n📋 Testing lowercase field names...')
    
    try {
      const users = await prisma.radCheck.findMany({
        select: {
          username: true,
          attribute: true,
          value: true
        },
        take: 1
      })
      console.log('✅ Lowercase field names work:', users.length > 0 ? 'Found users' : 'No users found')
    } catch (error) {
      console.log('❌ Lowercase field names failed:', error.message)
    }

    // Check groups
    console.log('\n👥 Testing groups...')
    try {
      const groups = await prisma.radGroupCheck.findMany({
        select: {
          groupname: true,
          attribute: true,
          value: true
        },
        take: 1
      })
      console.log('✅ Groups work with lowercase:', groups.length > 0 ? 'Found groups' : 'No groups found')
    } catch (error) {
      console.log('❌ Groups failed:', error.message)
    }

    // Test creating a user with lowercase field names
    console.log('\n🧪 Testing user creation...')
    try {
      const testUser = await prisma.radCheck.create({
        data: {
          username: 'testuser2',
          attribute: 'Cleartext-Password',
          op: ':=',
          value: 'testpass456'
        }
      })
      console.log('✅ User created successfully with lowercase fields')
      console.log(`   Username: ${testUser.username}`)
      console.log(`   Attribute: ${testUser.attribute}`)
      console.log(`   Value: ${testUser.value}`)
      
      // Clean up
      await prisma.radCheck.delete({
        where: { id: testUser.id }
      })
      console.log('✅ Test user cleaned up')
      
    } catch (error) {
      console.log('❌ User creation failed:', error.message)
    }

  } catch (error) {
    console.error('❌ Error checking database structure:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

checkDatabaseStructure()
  .catch((error) => {
    console.error('💥 Database check failed:', error)
    process.exit(1)
  })
