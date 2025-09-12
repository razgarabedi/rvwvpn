const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Creating test user...')
  
  try {
    // Create a test user
    const testUser = await prisma.radCheck.create({
      data: {
        UserName: 'testuser',
        Attribute: 'Cleartext-Password',
        op: ':=',
        Value: 'testpass123'
      }
    })
    
    console.log('✅ Test user created successfully:')
    console.log(`   Username: ${testUser.UserName}`)
    console.log(`   Attribute: ${testUser.Attribute}`)
    console.log(`   Value: ${testUser.Value}`)
    
    // Assign user to a group
    const userGroup = await prisma.radUserGroup.create({
      data: {
        UserName: 'testuser',
        GroupName: 'vpn-users',
        priority: 1
      }
    })
    
    console.log('✅ User assigned to group:')
    console.log(`   Username: ${userGroup.UserName}`)
    console.log(`   Group: ${userGroup.GroupName}`)
    console.log(`   Priority: ${userGroup.priority}`)
    
    // Add some reply attributes
    const replyAttributes = [
      { Attribute: 'Session-Timeout', op: ':=', Value: '3600' },
      { Attribute: 'Idle-Timeout', op: ':=', Value: '1800' }
    ]
    
    for (const attr of replyAttributes) {
      await prisma.radReply.create({
        data: {
          UserName: 'testuser',
          Attribute: attr.Attribute,
          op: attr.op,
          Value: attr.Value
        }
      })
    }
    
    console.log('✅ Reply attributes added:')
    replyAttributes.forEach(attr => {
      console.log(`   ${attr.Attribute} ${attr.op} ${attr.Value}`)
    })
    
    console.log('\n🎉 Test user setup complete!')
    console.log('You can now test the user management in the dashboard.')
    
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

main()
  .catch((error) => {
    console.error('💥 Test user creation failed:', error)
    process.exit(1)
  })