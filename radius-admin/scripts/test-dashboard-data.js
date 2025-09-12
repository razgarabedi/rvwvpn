const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDashboardData() {
  console.log('🧪 Testing Dashboard Data Loading...')
  console.log('====================================')
  
  try {
    // Test Users API
    console.log('\n👥 Testing Users API...')
    const users = await prisma.radCheck.findMany({
      orderBy: { UserName: 'asc' }
    })
    console.log(`✅ Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`   - ${user.UserName} (${user.Attribute} ${user.op} ${user.Value})`)
    })

    // Test Groups API
    console.log('\n👥 Testing Groups API...')
    const groups = await prisma.radGroupCheck.findMany({
      select: {
        GroupName: true
      },
      distinct: ['GroupName'],
      orderBy: {
        GroupName: 'asc'
      }
    })

    const groupChecks = await prisma.radGroupCheck.findMany({
      orderBy: {
        GroupName: 'asc'
      }
    })

    const groupReplies = await prisma.radGroupReply.findMany({
      orderBy: {
        GroupName: 'asc'
      }
    })

    const groupData = groups.map(group => ({
      name: group.GroupName,
      checks: groupChecks.filter(check => check.GroupName === group.GroupName),
      replies: groupReplies.filter(reply => reply.GroupName === group.GroupName)
    }))

    console.log(`✅ Found ${groupData.length} groups:`)
    groupData.forEach(group => {
      console.log(`   - ${group.name} (${group.checks.length} checks, ${group.replies.length} replies)`)
    })

    // Test NAS API
    console.log('\n🌐 Testing NAS API...')
    const nasDevices = await prisma.nas.findMany({
      orderBy: {
        nasname: 'asc'
      }
    })
    console.log(`✅ Found ${nasDevices.length} NAS devices:`)
    nasDevices.forEach(nas => {
      console.log(`   - ${nas.shortname} (${nas.nasname}) - ${nas.type}`)
    })

    // Test User Groups
    console.log('\n🔗 Testing User Groups...')
    const userGroups = await prisma.radUserGroup.findMany({
      orderBy: {
        UserName: 'asc'
      }
    })
    console.log(`✅ Found ${userGroups.length} user group assignments:`)
    userGroups.forEach(ug => {
      console.log(`   - ${ug.UserName} -> ${ug.GroupName} (priority: ${ug.priority})`)
    })

    // Test User Reply Attributes
    console.log('\n📤 Testing User Reply Attributes...')
    const userReplies = await prisma.radReply.findMany({
      orderBy: {
        UserName: 'asc'
      }
    })
    console.log(`✅ Found ${userReplies.length} user reply attributes:`)
    userReplies.forEach(reply => {
      console.log(`   - ${reply.UserName}: ${reply.Attribute} ${reply.op} ${reply.Value}`)
    })

    console.log('\n📊 Dashboard Data Summary:')
    console.log('==========================')
    console.log(`Users: ${users.length}`)
    console.log(`Groups: ${groupData.length}`)
    console.log(`NAS Devices: ${nasDevices.length}`)
    console.log(`User Group Assignments: ${userGroups.length}`)
    console.log(`User Reply Attributes: ${userReplies.length}`)

    if (users.length === 0) {
      console.log('\n⚠️  No users found - this might be why the dashboard appears empty')
    }
    
    if (groupData.length === 0) {
      console.log('\n⚠️  No groups found - this might be why the groups tab appears empty')
    }
    
    if (nasDevices.length === 0) {
      console.log('\n⚠️  No NAS devices found - this might be why the NAS tab appears empty')
    }

  } catch (error) {
    console.error('❌ Error testing dashboard data:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

testDashboardData()
  .catch((error) => {
    console.error('💥 Dashboard data test failed:', error)
    process.exit(1)
  })
