// Script to check what tables actually exist in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:a3eilm2s2y@localhost:5432/freeradius_db?schema=public"
    }
  }
});

async function checkTables() {
  console.log('🔍 Checking Actual Database Tables...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully\n');

    // Get all tables in the public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log('📋 Tables found in database:');
    console.log('=============================');
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }

    // Check specifically for FreeRADIUS3 tables
    const freeradiusTables = ['nas', 'radacct', 'radcheck', 'radreply', 'radgroupcheck', 'radgroupreply', 'radusergroup', 'radpostauth', 'nasreload'];
    
    console.log('\n🔍 Checking FreeRADIUS3 specific tables:');
    console.log('=========================================');
    
    for (const tableName of freeradiusTables) {
      const exists = tables.some(t => t.table_name === tableName);
      if (exists) {
        console.log(`   ✅ ${tableName} - EXISTS`);
        
        // Get table structure
        try {
          const columns = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = ${tableName} AND table_schema = 'public'
            ORDER BY ordinal_position;
          `;
          
          console.log(`      Columns:`);
          columns.forEach(col => {
            console.log(`        - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
          });
        } catch (error) {
          console.log(`      ❌ Could not get column info: ${error.message}`);
        }
      } else {
        console.log(`   ❌ ${tableName} - NOT FOUND`);
      }
      console.log('');
    }

    // Check for Prisma-specific tables
    console.log('🔧 Checking Prisma-specific tables:');
    console.log('===================================');
    
    const prismaTables = tables.filter(t => t.table_name.startsWith('_') || t.table_name.includes('prisma'));
    if (prismaTables.length > 0) {
      prismaTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('   No Prisma-specific tables found');
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

checkTables();
