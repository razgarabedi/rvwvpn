const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyDatabaseMigration() {
  console.log('🔄 Applying Database Migration for FreeRADIUS Compatibility...')
  console.log('============================================================')
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'fix-database-schema-for-freeradius.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📋 Migration SQL loaded successfully')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`)
          console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`)
          
          await prisma.$executeRawUnsafe(statement)
          console.log('   ✅ Success')
        } catch (error) {
          console.log(`   ⚠️  Warning: ${error.message}`)
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('\n🎉 Database migration completed!')
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...')
    
    const columnInfo = await prisma.$queryRaw`
      SELECT 
        table_name, 
        column_name, 
        data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('radcheck', 'radreply', 'radgroupcheck', 'radgroupreply', 'radusergroup', 'radacct', 'radpostauth', 'nasreload')
      ORDER BY table_name, ordinal_position
    `
    
    console.log('📊 Updated table structure:')
    let currentTable = ''
    columnInfo.forEach(col => {
      if (col.table_name !== currentTable) {
        currentTable = col.table_name
        console.log(`\n   ${currentTable}:`)
      }
      console.log(`     - ${col.column_name} (${col.data_type})`)
    })
    
    // Test the queries that FreeRADIUS will use
    console.log('\n🧪 Testing FreeRADIUS-compatible queries...')
    
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT id, username, attribute, value, op 
        FROM radcheck 
        WHERE username = 'testuser' 
        ORDER BY id
        LIMIT 1
      `
      console.log('✅ radcheck query works correctly')
    } catch (error) {
      console.log('❌ radcheck query failed:', error.message)
    }
    
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT id, username, attribute, value, op 
        FROM radreply 
        WHERE username = 'testuser' 
        ORDER BY id
        LIMIT 1
      `
      console.log('✅ radreply query works correctly')
    } catch (error) {
      console.log('❌ radreply query failed:', error.message)
    }
    
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT groupname 
        FROM radusergroup 
        WHERE username = 'testuser' 
        ORDER BY priority
        LIMIT 1
      `
      console.log('✅ radusergroup query works correctly')
    } catch (error) {
      console.log('❌ radusergroup query failed:', error.message)
    }
    
    console.log('\n💡 Next steps:')
    console.log('1. Run: npx prisma generate')
    console.log('2. Test your user management system')
    console.log('3. Test FreeRADIUS authentication')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed')
  }
}

applyDatabaseMigration()
  .catch((error) => {
    console.error('💥 Database migration failed:', error)
    process.exit(1)
  })
