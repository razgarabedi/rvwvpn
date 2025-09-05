// Diagnostic script to check the system status
const { PrismaClient } = require('@prisma/client')

async function diagnose() {
  console.log('🔍 Diagnosing Radius Admin System...')
  console.log('')

  try {
    // Test database connection
    console.log('1. Testing database connection...')
    const prisma = new PrismaClient()
    
    // Test basic connection
    await prisma.$connect()
    console.log('   ✅ Database connection successful')
    
    // Test if RadiusServerConfig table exists
    try {
      const servers = await prisma.radiusServerConfig.findMany()
      console.log(`   ✅ RadiusServerConfig table exists (${servers.length} records)`)
    } catch (error) {
      console.log('   ❌ RadiusServerConfig table does not exist')
      console.log('   💡 Run: npx prisma db push')
    }
    
    // Test if AdminUser table exists
    try {
      const users = await prisma.adminUser.findMany()
      console.log(`   ✅ AdminUser table exists (${users.length} records)`)
    } catch (error) {
      console.log('   ❌ AdminUser table does not exist')
      console.log('   💡 Run: npx prisma db push')
    }
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.log('   ❌ Database connection failed')
    console.log('   Error:', error.message)
    console.log('   💡 Check your DATABASE_URL in .env file')
  }

  console.log('')
  console.log('2. Testing API endpoints...')
  
  try {
    const response = await fetch('http://localhost:3000/api/radius/servers')
    if (response.ok) {
      console.log('   ✅ API endpoint is accessible')
    } else {
      console.log(`   ❌ API endpoint returned status: ${response.status}`)
    }
  } catch (error) {
    console.log('   ❌ API endpoint is not accessible')
    console.log('   💡 Make sure the development server is running: npm run dev')
  }

  console.log('')
  console.log('🎯 Next Steps:')
  console.log('1. If database connection failed: Check DATABASE_URL in .env')
  console.log('2. If tables don\'t exist: Run npx prisma db push')
  console.log('3. If API not accessible: Run npm run dev')
  console.log('4. If everything looks good: Try accessing http://localhost:3000')
}

diagnose().catch(console.error)
