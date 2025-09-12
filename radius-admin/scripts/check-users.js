// Script to check users in the FreeRADIUS3 database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:a3eilm2s2y@localhost:5432/freeradius_db?schema=public"
    }
  }
});

async function checkUsers() {
  console.log('🔍 Checking Users in FreeRADIUS3 Database...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully\n');

    // 1. Check RADIUS users (radcheck table)
    console.log('📋 RADIUS Users (radcheck table):');
    console.log('=====================================');
    
    const radiusUsers = await prisma.radCheck.findMany({
      orderBy: { UserName: 'asc' }
    });

    if (radiusUsers.length === 0) {
      console.log('❌ No RADIUS users found in radcheck table');
    } else {
      console.log(`✅ Found ${radiusUsers.length} RADIUS user(s):`);
      radiusUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Username: ${user.UserName}`);
        console.log(`      Attribute: ${user.Attribute}`);
        console.log(`      Operation: ${user.op}`);
        console.log(`      Value: ${user.Value}`);
        console.log(`      ID: ${user.id}`);
        console.log('');
      });
    }

    // 2. Check user groups (radusergroup table)
    console.log('👥 User Groups (radusergroup table):');
    console.log('=====================================');
    
    const userGroups = await prisma.radUserGroup.findMany({
      orderBy: { UserName: 'asc' }
    });

    if (userGroups.length === 0) {
      console.log('❌ No user groups found in radusergroup table');
    } else {
      console.log(`✅ Found ${userGroups.length} user group(s):`);
      userGroups.forEach((group, index) => {
        console.log(`   ${index + 1}. Username: ${group.UserName}`);
        console.log(`      Group: ${group.GroupName}`);
        console.log(`      Priority: ${group.priority}`);
        console.log(`      ID: ${group.id}`);
        console.log('');
      });
    }

    // 3. Check user reply attributes (radreply table)
    console.log('📤 User Reply Attributes (radreply table):');
    console.log('===========================================');
    
    const userReplies = await prisma.radReply.findMany({
      orderBy: { UserName: 'asc' }
    });

    if (userReplies.length === 0) {
      console.log('❌ No user reply attributes found in radreply table');
    } else {
      console.log(`✅ Found ${userReplies.length} user reply attribute(s):`);
      userReplies.forEach((reply, index) => {
        console.log(`   ${index + 1}. Username: ${reply.UserName}`);
        console.log(`      Attribute: ${reply.Attribute}`);
        console.log(`      Operation: ${reply.op}`);
        console.log(`      Value: ${reply.Value}`);
        console.log(`      ID: ${reply.id}`);
        console.log('');
      });
    }

    // 4. Check accounting records (radacct table)
    console.log('📊 Accounting Records (radacct table):');
    console.log('======================================');
    
    const accountingRecords = await prisma.radAcct.findMany({
      take: 5, // Show only first 5 records
      orderBy: { RadAcctId: 'desc' }
    });

    if (accountingRecords.length === 0) {
      console.log('❌ No accounting records found in radacct table');
    } else {
      console.log(`✅ Found accounting records (showing latest 5):`);
      accountingRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Session ID: ${record.AcctSessionId || 'N/A'}`);
        console.log(`      Username: ${record.UserName || 'N/A'}`);
        console.log(`      NAS IP: ${record.NASIPAddress}`);
        console.log(`      Start Time: ${record.AcctStartTime || 'N/A'}`);
        console.log(`      Stop Time: ${record.AcctStopTime || 'N/A'}`);
        console.log(`      Input Octets: ${record.AcctInputOctets || 0}`);
        console.log(`      Output Octets: ${record.AcctOutputOctets || 0}`);
        console.log('');
      });
    }

    // 5. Check admin users
    console.log('👤 Admin Users:');
    console.log('===============');
    
    const adminUsers = await prisma.adminUser.findMany();
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. Email: ${admin.email}`);
        console.log(`      ID: ${admin.id}`);
        console.log(`      Created: ${admin.createdAt}`);
        console.log(`      Updated: ${admin.updatedAt}`);
        console.log('');
      });
    }

    // 6. Summary
    console.log('📈 Database Summary:');
    console.log('====================');
    console.log(`RADIUS Users: ${radiusUsers.length}`);
    console.log(`User Groups: ${userGroups.length}`);
    console.log(`User Reply Attributes: ${userReplies.length}`);
    console.log(`Accounting Records: ${await prisma.radAcct.count()}`);
    console.log(`Admin Users: ${adminUsers.length}`);

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

checkUsers();
