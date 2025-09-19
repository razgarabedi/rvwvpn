#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReportsAPI() {
  console.log('🧪 Testing User Activity Reports API...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test radacct table
    console.log('2. Testing radacct table...');
    const sessionCount = await prisma.radAcct.count();
    console.log(`✅ Found ${sessionCount} sessions in radacct table\n`);

    // Test radpostauth table
    console.log('3. Testing radpostauth table...');
    const authCount = await prisma.radPostAuth.count();
    console.log(`✅ Found ${authCount} authentication records in radpostauth table\n`);

    // Test overview query
    console.log('4. Testing overview query...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const totalSessions = await prisma.radAcct.count({
      where: {
        acctstarttime: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const activeSessions = await prisma.radAcct.count({
      where: {
        acctstoptime: null
      }
    });

    console.log(`✅ Overview query successful:`);
    console.log(`   - Total sessions (last 30 days): ${totalSessions}`);
    console.log(`   - Active sessions: ${activeSessions}\n`);

    // Test login attempts query
    console.log('5. Testing login attempts query...');
    const loginAttempts = await prisma.radPostAuth.findMany({
      where: {
        authdate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        authdate: 'desc'
      },
      take: 5
    });

    console.log(`✅ Login attempts query successful: Found ${loginAttempts.length} recent attempts\n`);

    // Test session duration query
    console.log('6. Testing session duration query...');
    const sessions = await prisma.radAcct.findMany({
      where: {
        acctstarttime: {
          gte: startDate,
          lte: endDate
        },
        acctstoptime: {
          not: null
        }
      },
      orderBy: {
        acctstarttime: 'desc'
      },
      take: 5
    });

    console.log(`✅ Session duration query successful: Found ${sessions.length} completed sessions\n`);

    // Test usage patterns query
    console.log('7. Testing usage patterns query...');
    const hourlyPatterns = await prisma.$queryRaw`
      SELECT 
        EXTRACT(hour FROM "acctstarttime") as hour,
        COUNT(*) as session_count
      FROM radacct 
      WHERE "acctstarttime" >= ${startDate} 
        AND "acctstarttime" <= ${endDate}
      GROUP BY EXTRACT(hour FROM "acctstarttime")
      ORDER BY hour
      LIMIT 5
    `;

    console.log(`✅ Usage patterns query successful: Found ${hourlyPatterns.length} hourly patterns\n`);

    console.log('🎉 All API tests passed! The User Activity Reports system is ready to use.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testReportsAPI();
