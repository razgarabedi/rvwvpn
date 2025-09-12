// Script to set up test data for FreeRADIUS3
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:a3eilm2s2y@localhost:5432/freeradius_db?schema=public"
    }
  }
});

async function setupFreeRADIUSTest() {
  console.log('🔧 Setting up FreeRADIUS3 Test Data...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully\n');

    // 1. Create a test NAS (Network Access Server)
    console.log('📡 Creating test NAS...');
    const testNAS = await prisma.nas.upsert({
      where: { id: 1 },
      update: {
        nasname: '192.168.1.100',
        shortname: 'test-nas',
        type: 'other',
        secret: 'testing123',
        description: 'Test NAS for FreeRADIUS3'
      },
      create: {
        nasname: '192.168.1.100',
        shortname: 'test-nas',
        type: 'other',
        secret: 'testing123',
        description: 'Test NAS for FreeRADIUS3'
      }
    });
    console.log(`✅ NAS created: ${testNAS.nasname} (${testNAS.shortname})`);

    // 2. Create a test user
    console.log('\n👤 Creating test user...');
    const testUser = await prisma.radCheck.upsert({
      where: {
        id: 1
      },
      update: {
        UserName: 'testuser',
        Attribute: 'Cleartext-Password',
        op: ':=',
        Value: 'testpass123'
      },
      create: {
        UserName: 'testuser',
        Attribute: 'Cleartext-Password',
        op: ':=',
        Value: 'testpass123'
      }
    });
    console.log(`✅ User created: ${testUser.UserName} with password ${testUser.Value}`);

    // 3. Create user group
    console.log('\n👥 Creating user group...');
    const userGroup = await prisma.radUserGroup.upsert({
      where: {
        id: 1
      },
      update: {
        UserName: 'testuser',
        GroupName: 'users',
        priority: 1
      },
      create: {
        UserName: 'testuser',
        GroupName: 'users',
        priority: 1
      }
    });
    console.log(`✅ User group created: ${userGroup.UserName} -> ${userGroup.GroupName}`);

    // 4. Create group check attributes
    console.log('\n🔐 Creating group check attributes...');
    const groupCheck = await prisma.radGroupCheck.upsert({
      where: {
        id: 1
      },
      update: {
        GroupName: 'users',
        Attribute: 'Auth-Type',
        op: ':=',
        Value: 'Local'
      },
      create: {
        GroupName: 'users',
        Attribute: 'Auth-Type',
        op: ':=',
        Value: 'Local'
      }
    });
    console.log(`✅ Group check created: ${groupCheck.GroupName} - ${groupCheck.Attribute} ${groupCheck.op} ${groupCheck.Value}`);

    // 5. Create group reply attributes
    console.log('\n📤 Creating group reply attributes...');
    const groupReplies = [
      {
        GroupName: 'users',
        Attribute: 'Service-Type',
        op: '=',
        Value: 'Framed-User'
      },
      {
        GroupName: 'users',
        Attribute: 'Framed-Protocol',
        op: '=',
        Value: 'PPP'
      },
      {
        GroupName: 'users',
        Attribute: 'Framed-IP-Address',
        op: '=',
        Value: '192.168.1.100'
      }
    ];

    for (let i = 0; i < groupReplies.length; i++) {
      const reply = groupReplies[i];
      await prisma.radGroupReply.upsert({
        where: {
          id: i + 1
        },
        update: reply,
        create: reply
      });
      console.log(`✅ Group reply created: ${reply.GroupName} - ${reply.Attribute} ${reply.op} ${reply.Value}`);
    }

    // 6. Create user reply attributes (optional)
    console.log('\n📤 Creating user reply attributes...');
    const userReplies = [
      {
        UserName: 'testuser',
        Attribute: 'Session-Timeout',
        op: '=',
        Value: '3600'
      },
      {
        UserName: 'testuser',
        Attribute: 'Idle-Timeout',
        op: '=',
        Value: '1800'
      }
    ];

    for (let i = 0; i < userReplies.length; i++) {
      const reply = userReplies[i];
      await prisma.radReply.upsert({
        where: {
          id: i + 1
        },
        update: reply,
        create: reply
      });
      console.log(`✅ User reply created: ${reply.UserName} - ${reply.Attribute} ${reply.op} ${reply.Value}`);
    }

    console.log('\n🎉 FreeRADIUS3 Test Data Setup Complete!');
    console.log('\n📝 Test Configuration:');
    console.log('======================');
    console.log('Username: testuser');
    console.log('Password: testpass123');
    console.log('NAS IP: 192.168.1.100');
    console.log('NAS Secret: testing123');
    console.log('\n🧪 Test with radtest:');
    console.log('radtest testuser testpass123 192.168.1.100 0 testing123');
    console.log('\n📊 Database Tables Populated:');
    console.log('- nas: Network Access Server');
    console.log('- radcheck: User authentication');
    console.log('- radusergroup: User-group mapping');
    console.log('- radgroupcheck: Group authentication');
    console.log('- radgroupreply: Group reply attributes');
    console.log('- radreply: User reply attributes');

  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

setupFreeRADIUSTest();
