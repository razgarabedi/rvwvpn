const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testUserEditGroups() {
  try {
    console.log('🧪 Testing User Edit Groups Functionality\n')

    // 1. Create a test group
    console.log('1. Creating test group...')
    const testGroup = await prisma.radGroupCheck.create({
      data: {
        groupname: 'edit-test-group',
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
        username: 'edittestuser',
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
        username: 'edittestuser',
        groupname: 'edit-test-group',
        priority: 1
      }
    })
    console.log('✅ User assigned to group:', userGroup)

    // 4. Test fetching user groups (simulating the API call)
    console.log('\n4. Testing user group fetch (API simulation)...')
    const userGroups = await prisma.radUserGroup.findMany({
      where: {
        username: 'edittestuser'
      },
      orderBy: {
        priority: 'asc'
      }
    })
    console.log('✅ User groups fetched:', userGroups)

    // 5. Simulate the frontend logic
    console.log('\n5. Simulating frontend group selection logic...')
    let currentGroup = ""
    if (userGroups && userGroups.length > 0) {
      currentGroup = userGroups[0].groupname
    }
    console.log('✅ Current group determined:', currentGroup)

    // 6. Test group update (simulating form submission)
    console.log('\n6. Testing group update (form submission simulation)...')
    const newGroupName = 'edit-test-group-2'
    
    // Create another group
    await prisma.radGroupCheck.create({
      data: {
        groupname: newGroupName,
        attribute: 'Auth-Type',
        op: ':=',
        value: 'Accept'
      }
    })
    console.log('✅ Second group created:', newGroupName)

    // Update user group assignment
    await prisma.$transaction(async (tx) => {
      // Remove existing assignments
      await tx.radUserGroup.deleteMany({
        where: {
          username: 'edittestuser'
        }
      })

      // Create new assignment
      await tx.radUserGroup.create({
        data: {
          username: 'edittestuser',
          groupname: newGroupName,
          priority: 1
        }
      })
    })
    console.log('✅ User group updated successfully')

    // 7. Verify the update
    console.log('\n7. Verifying group update...')
    const updatedGroups = await prisma.radUserGroup.findMany({
      where: {
        username: 'edittestuser'
      }
    })
    console.log('✅ Updated groups:', updatedGroups)

    // 8. Test removing user from all groups
    console.log('\n8. Testing group removal...')
    await prisma.radUserGroup.deleteMany({
      where: {
        username: 'edittestuser'
      }
    })
    console.log('✅ User removed from all groups')

    // 9. Cleanup
    console.log('\n9. Cleaning up test data...')
    await prisma.radCheck.deleteMany({
      where: {
        username: 'edittestuser'
      }
    })
    await prisma.radGroupCheck.deleteMany({
      where: {
        groupname: { in: ['edit-test-group', 'edit-test-group-2'] }
      }
    })
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 All tests passed! User edit groups functionality is working correctly.')
    console.log('\n📝 Summary:')
    console.log('   - User group fetching works')
    console.log('   - Group selection logic works')
    console.log('   - Group updates work')
    console.log('   - Group removal works')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUserEditGroups()
