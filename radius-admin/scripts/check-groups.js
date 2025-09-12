const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Groups in FreeRADIUS3 Database...')
  console.log('')

  try {
    // Check groups
    const groups = await prisma.radGroupCheck.findMany({
      select: {
        GroupName: true,
        Attribute: true,
        op: true,
        Value: true
      },
      orderBy: {
        GroupName: 'asc'
      }
    })

    console.log('📋 RADIUS Groups (radgroupcheck table):')
    console.log('=====================================')
    
    if (groups.length === 0) {
      console.log('❌ No groups found in radgroupcheck table')
    } else {
      // Group by GroupName
      const groupedData = {}
      groups.forEach(group => {
        if (!groupedData[group.GroupName]) {
          groupedData[group.GroupName] = []
        }
        groupedData[group.GroupName].push({
          Attribute: group.Attribute,
          op: group.op,
          Value: group.Value
        })
      })

      Object.keys(groupedData).forEach(groupName => {
        console.log(`\n📁 Group: ${groupName}`)
        console.log('   Check Attributes:')
        groupedData[groupName].forEach(attr => {
          console.log(`     ${attr.Attribute} ${attr.op} ${attr.Value}`)
        })
      })
    }

    // Check group replies
    const groupReplies = await prisma.radGroupReply.findMany({
      select: {
        GroupName: true,
        Attribute: true,
        op: true,
        Value: true
      },
      orderBy: {
        GroupName: 'asc'
      }
    })

    console.log('\n📤 Group Reply Attributes (radgroupreply table):')
    console.log('===============================================')
    
    if (groupReplies.length === 0) {
      console.log('❌ No group reply attributes found in radgroupreply table')
    } else {
      // Group by GroupName
      const groupedReplies = {}
      groupReplies.forEach(reply => {
        if (!groupedReplies[reply.GroupName]) {
          groupedReplies[reply.GroupName] = []
        }
        groupedReplies[reply.GroupName].push({
          Attribute: reply.Attribute,
          op: reply.op,
          Value: reply.Value
        })
      })

      Object.keys(groupedReplies).forEach(groupName => {
        console.log(`\n📁 Group: ${groupName}`)
        console.log('   Reply Attributes:')
        groupedReplies[groupName].forEach(attr => {
          console.log(`     ${attr.Attribute} ${attr.op} ${attr.Value}`)
        })
      })
    }

    // Check NAS devices
    const nasDevices = await prisma.nas.findMany({
      orderBy: {
        nasname: 'asc'
      }
    })

    console.log('\n🌐 NAS Devices (nas table):')
    console.log('============================')
    
    if (nasDevices.length === 0) {
      console.log('❌ No NAS devices found in nas table')
    } else {
      nasDevices.forEach((nas, index) => {
        console.log(`\n${index + 1}. ${nas.shortname} (${nas.nasname})`)
        console.log(`   Type: ${nas.type}`)
        console.log(`   Ports: ${nas.ports || 'Default'}`)
        console.log(`   Server: ${nas.server || 'N/A'}`)
        console.log(`   Community: ${nas.community || 'N/A'}`)
        console.log(`   Description: ${nas.description || 'N/A'}`)
      })
    }

    console.log('\n📈 Database Summary:')
    console.log('====================')
    console.log(`Groups: ${Object.keys(groupedData).length}`)
    console.log(`Group Reply Attributes: ${Object.keys(groupedReplies).length}`)
    console.log(`NAS Devices: ${nasDevices.length}`)

  } catch (error) {
    console.error('❌ Error checking groups:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

main()
  .catch((error) => {
    console.error('💥 Group check failed:', error)
    process.exit(1)
  })
