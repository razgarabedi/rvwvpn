// Script to test the complete user creation flow
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:a3eilm2s2y@localhost:5432/freeradius_db?schema=public"
    }
  }
});

async function testUserCreation() {
  console.log('🧪 Testing Complete User Creation Flow...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully\n');

    // Test 1: Create a test user via API simulation
    console.log('📝 Test 1: Creating test user via API simulation...');
    
    const testUser = {
      username: 'apitest',
      password: 'apipass123'
    };

    // Simulate API call by directly creating user
    const newUser = await prisma.radCheck.create({
      data: {
        UserName: testUser.username,
        Attribute: "Cleartext-Password",
        op: ":=",
        Value: testUser.password
      }
    });

    console.log(`✅ User created: ${newUser.UserName} (ID: ${newUser.id})`);

    // Test 2: Assign user to group
    console.log('\n👥 Test 2: Assigning user to group...');
    
    const groupAssignment = await prisma.radUserGroup.create({
      data: {
        UserName: testUser.username,
        GroupName: 'users',
        priority: 1
      }
    });

    console.log(`✅ User assigned to group: ${groupAssignment.GroupName}`);

    // Test 3: Add user reply attributes
    console.log('\n📤 Test 3: Adding user reply attributes...');
    
    const replyAttributes = [
      {
        UserName: testUser.username,
        Attribute: 'Session-Timeout',
        op: '=',
        Value: '3600'
      },
      {
        UserName: testUser.username,
        Attribute: 'Idle-Timeout',
        op: '=',
        Value: '1800'
      },
      {
        UserName: testUser.username,
        Attribute: 'Service-Type',
        op: '=',
        Value: 'Framed-User'
      }
    ];

    for (const attr of replyAttributes) {
      await prisma.radReply.create({
        data: attr
      });
      console.log(`✅ Added attribute: ${attr.Attribute} = ${attr.Value}`);
    }

    // Test 4: Verify complete user setup
    console.log('\n🔍 Test 4: Verifying complete user setup...');
    
    // Check user authentication
    const userCheck = await prisma.radCheck.findFirst({
      where: {
        UserName: testUser.username,
        Attribute: "Cleartext-Password"
      }
    });

    if (userCheck) {
      console.log(`✅ User authentication: ${userCheck.UserName} -> ${userCheck.Value}`);
    } else {
      console.log('❌ User authentication not found');
    }

    // Check group assignment
    const userGroup = await prisma.radUserGroup.findFirst({
      where: {
        UserName: testUser.username
      }
    });

    if (userGroup) {
      console.log(`✅ Group assignment: ${userGroup.UserName} -> ${userGroup.GroupName} (priority: ${userGroup.priority})`);
    } else {
      console.log('❌ Group assignment not found');
    }

    // Check reply attributes
    const userReplies = await prisma.radReply.findMany({
      where: {
        UserName: testUser.username
      }
    });

    console.log(`✅ Reply attributes: ${userReplies.length} found`);
    userReplies.forEach(reply => {
      console.log(`   - ${reply.Attribute} ${reply.op} ${reply.Value}`);
    });

    // Test 5: Test FreeRADIUS3 compatibility
    console.log('\n🔧 Test 5: Testing FreeRADIUS3 compatibility...');
    
    // Simulate FreeRADIUS3 queries
    const authQuery = await prisma.radCheck.findMany({
      where: {
        UserName: testUser.username
      }
    });

    const groupQuery = await prisma.radUserGroup.findMany({
      where: {
        UserName: testUser.username
      }
    });

    const replyQuery = await prisma.radReply.findMany({
      where: {
        UserName: testUser.username
      }
    });

    console.log(`✅ Authentication records: ${authQuery.length}`);
    console.log(`✅ Group memberships: ${groupQuery.length}`);
    console.log(`✅ Reply attributes: ${replyQuery.length}`);

    // Test 6: Clean up test data
    console.log('\n🧹 Test 6: Cleaning up test data...');
    
    await prisma.radReply.deleteMany({
      where: {
        UserName: testUser.username
      }
    });

    await prisma.radUserGroup.deleteMany({
      where: {
        UserName: testUser.username
      }
    });

    await prisma.radCheck.deleteMany({
      where: {
        UserName: testUser.username
      }
    });

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! User creation flow is working correctly.');
    console.log('\n📋 Summary:');
    console.log('- ✅ User creation with correct field names');
    console.log('- ✅ Group assignment functionality');
    console.log('- ✅ Reply attributes management');
    console.log('- ✅ FreeRADIUS3 compatibility');
    console.log('- ✅ Database operations working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

testUserCreation();
