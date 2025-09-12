const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:a3eilm2s2y@localhost:5432/freeradius_db?schema=public"
      }
    }
  });

  try {
    console.log('🔌 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Test FreeRADIUS3 specific tables
    const freeradiusTables = ['radacct', 'radcheck', 'radreply', 'radgroupcheck', 'radgroupreply', 'radusergroup', 'radpostauth', 'nas', 'nasreload'];
    
    console.log('\n🔍 Checking FreeRADIUS3 tables:');
    for (const tableName of freeradiusTables) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        console.log(`   ✅ ${tableName}: ${result[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      }
    }
    
    // Test admin tables
    console.log('\n👤 Checking admin tables:');
    try {
      const adminCount = await prisma.adminUser.count();
      console.log(`   ✅ AdminUser: ${adminCount} records`);
    } catch (error) {
      console.log(`   ❌ AdminUser: ${error.message}`);
    }
    
    try {
      const serverCount = await prisma.radiusServerConfig.count();
      console.log(`   ✅ RadiusServerConfig: ${serverCount} records`);
    } catch (error) {
      console.log(`   ❌ RadiusServerConfig: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

testConnection();
