const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testGroupsAPI() {
  console.log('🧪 Testing Groups API Logic...')
  
  try {
    // Simulate the groups API logic
    const groups = await prisma.radGroupCheck.findMany({
      select: {
        GroupName: true
      },
      distinct: ['GroupName'],
      orderBy: {
        GroupName: 'asc'
      }
    })

    console.log(`✅ Found ${groups.length} unique groups:`)
    groups.forEach(group => {
      console.log(`   - ${group.GroupName}`)
    })

    // Get group check attributes
    const groupChecks = await prisma.radGroupCheck.findMany({
      orderBy: {
        GroupName: 'asc'
      }
    })

    // Get group reply attributes
    const groupReplies = await prisma.radGroupReply.findMany({
      orderBy: {
        GroupName: 'asc'
      }
    })

    // Combine data
    const groupData = groups.map(group => ({
      name: group.GroupName,
      checks: groupChecks.filter(check => check.GroupName === group.GroupName),
      replies: groupReplies.filter(reply => reply.GroupName === group.GroupName)
    }))

    console.log('\n📋 Group Data Structure:')
    groupData.forEach(group => {
      console.log(`\n📁 ${group.name}:`)
      console.log(`   Checks: ${group.checks.length}`)
      console.log(`   Replies: ${group.replies.length}`)
    })

    return groupData
  } catch (error) {
    console.error('❌ Error testing groups API:', error)
    return []
  }
}

async function testNASAPI() {
  console.log('\n🧪 Testing NAS API Logic...')
  
  try {
    const nasDevices = await prisma.nas.findMany({
      orderBy: {
        nasname: 'asc'
      }
    })

    console.log(`✅ Found ${nasDevices.length} NAS devices:`)
    nasDevices.forEach(nas => {
      console.log(`   - ${nas.shortname} (${nas.nasname})`)
    })

    return nasDevices
  } catch (error) {
    console.error('❌ Error testing NAS API:', error)
    return []
  }
}

async function main() {
  console.log('🔍 Testing API Endpoints Logic...')
  console.log('==================================')
  
  try {
    const groups = await testGroupsAPI()
    const nasDevices = await testNASAPI()
    
    console.log('\n📊 Summary:')
    console.log(`Groups: ${groups.length}`)
    console.log(`NAS Devices: ${nasDevices.length}`)
    
    if (groups.length === 0) {
      console.log('\n⚠️  No groups found! This might be why the dashboard is empty.')
    }
    
    if (nasDevices.length === 0) {
      console.log('\n⚠️  No NAS devices found! This might be why the dashboard is empty.')
    }
    
  } catch (error) {
    console.error('❌ Error during API testing:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

main()
  .catch((error) => {
    console.error('💥 API test failed:', error)
    process.exit(1)
  })
