const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function assignUserToGroup() {
  console.log('👥 Assigning user "vpn" to group...')
  console.log('================================')
  
  try {
    // Assign user "vpn" to "vpn-users" group
    const userGroup = await prisma.radUserGroup.create({
      data: {
        username: 'vpn',
        groupname: 'vpn-users',
        priority: 1
      }
    })
    
    console.log('✅ User "vpn" assigned to "vpn-users" group')
    console.log(`   Group ID: ${userGroup.id}`)
    console.log(`   Username: ${userGroup.username}`)
    console.log(`   Group: ${userGroup.groupname}`)
    console.log(`   Priority: ${userGroup.priority}`)

    // Verify the assignment
    const verification = await prisma.radUserGroup.findFirst({
      where: {
        username: 'vpn',
        groupname: 'vpn-users'
      }
    })
    
    if (verification) {
      console.log('✅ Assignment verified successfully')
    } else {
      console.log('❌ Assignment verification failed')
    }

    console.log('\n🎉 User "vpn" is now ready for FreeRADIUS3 authentication!')
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  User "vpn" is already assigned to "vpn-users" group')
    } else {
      console.error('❌ Error assigning user to group:', error)
    }
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

assignUserToGroup()
  .catch((error) => {
    console.error('💥 User group assignment failed:', error)
    process.exit(1)
  })
