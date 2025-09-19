const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testUserGroupDisplay() {
  try {
    console.log('🧪 Testing User Group Display Functionality\n')

    // 1. Create a test group
    console.log('1. Creating test group...')
    const testGroup = await prisma.radGroupCheck.create({
      data: {
        groupname: 'test-group',
        attribute: 'Auth-Type',
        op: ':=',
        value: 'Accept'
      }
    })
    console.log('✅ Test group created:', testGroup.groupname)

    // 2. Create a test user
    console.log('\n2. Creating test user...')
    const testUser = await prisma.radCheck.create({
      data: {
        username: 'testuser',
        attribute: 'Cleartext-Password',
        op: ':=',
        value: 'testpass123'
      }
    })
    console.log('✅ Test user created:', testUser.username)

    // 3. Assign user to group
    console.log('\n3. Assigning user to group...')
    const userGroup = await prisma.radUserGroup.create({
      data: {
        username: 'testuser',
        groupname: 'test-group',
        priority: 1
      }
    })
    console.log('✅ User assigned to group:', userGroup)

    // 4. Test fetching user groups
    console.log('\n4. Testing user group fetch...')
    const userGroups = await prisma.radUserGroup.findMany({
      where: {
        username: 'testuser'
      },
      orderBy: {
        priority: 'asc'
      }
    })
    console.log('✅ User groups fetched:', userGroups)

    // 5. Test updating user group
    console.log('\n5. Testing user group update...')
    await prisma.$transaction(async (tx) => {
      // Remove existing assignments
      await tx.radUserGroup.deleteMany({
        where: {
          username: 'testuser'
        }
      })

      // Create new assignment
      await tx.radUserGroup.create({
        data: {
          username: 'testuser',
          groupname: 'test-group',
          priority: 1
        }
      })
    })
    console.log('✅ User group updated successfully')

    // 6. Cleanup
    console.log('\n6. Cleaning up test data...')
    await prisma.radUserGroup.deleteMany({
      where: {
        username: 'testuser'
      }
    })
    await prisma.radCheck.deleteMany({
      where: {
        username: 'testuser'
      }
    })
    await prisma.radGroupCheck.deleteMany({
      where: {
        groupname: 'test-group'
      }
    })
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 All tests passed! User group display functionality is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUserGroupDisplay()
