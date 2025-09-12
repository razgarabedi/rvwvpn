const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkActualDatabaseColumns() {
  console.log('🔍 Checking Actual Database Column Names...')
  console.log('==========================================')
  
  try {
    // Check the actual column names in the database
    console.log('\n📋 Checking radcheck table structure...')
    
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'radcheck' 
      ORDER BY ordinal_position
    `
    
    console.log('✅ radcheck table columns:')
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`)
    })

    // Test querying with the actual column names
    console.log('\n🔍 Testing with actual column names...')
    
    const usersWithActualNames = await prisma.$queryRaw`
      SELECT id, "UserName", "Attribute", "Value", op 
      FROM radcheck 
      WHERE "UserName" = 'vpn'
    `
    
    console.log('✅ Query with PascalCase column names works')
    console.log(`   Found ${usersWithActualNames.length} user(s)`)
    if (usersWithActualNames.length > 0) {
      console.log(`   User: ${JSON.stringify(usersWithActualNames[0])}`)
    }

    // Test the Prisma mapped fields
    console.log('\n🔍 Testing Prisma mapped fields...')
    
    const usersWithMappedFields = await prisma.radCheck.findMany({
      where: {
        username: 'vpn'
      }
    })
    
    console.log('✅ Prisma mapped fields work')
    console.log(`   Found ${usersWithMappedFields.length} user(s)`)
    if (usersWithMappedFields.length > 0) {
      console.log(`   User: ${usersWithMappedFields[0].username} - ${usersWithMappedFields[0].value}`)
    }

    // Check NAS table
    console.log('\n📋 Checking nas table structure...')
    
    const nasInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'nas' 
      ORDER BY ordinal_position
    `
    
    console.log('✅ nas table columns:')
    nasInfo.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`)
    })

    // Test NAS query with actual column names
    console.log('\n🔍 Testing NAS query with actual column names...')
    
    const nasDevices = await prisma.$queryRaw`
      SELECT id, nasname, shortname, type, secret, server 
      FROM nas
    `
    
    console.log('✅ NAS query with actual column names works')
    console.log(`   Found ${nasDevices.length} NAS device(s)`)
    if (nasDevices.length > 0) {
      console.log(`   Sample NAS: ${nasDevices[0].nasname}`)
    }

  } catch (error) {
    console.error('❌ Error checking database columns:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

checkActualDatabaseColumns()
  .catch((error) => {
    console.error('💥 Database column check failed:', error)
    process.exit(1)
  })
