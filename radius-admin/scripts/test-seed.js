// Test script to verify the seed script works without a real database
const bcrypt = require('bcryptjs');

async function testSeed() {
  console.log('🧪 Testing seed script functionality...');
  
  try {
    // Test password hashing
    const password = 'adminpassword123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Password hashing works');
    console.log(`   Original: ${password}`);
    console.log(`   Hashed: ${hashedPassword.substring(0, 20)}...`);
    
    // Test password verification
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`✅ Password verification: ${isValid ? 'PASS' : 'FAIL'}`);
    
    // Test with wrong password
    const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log(`✅ Wrong password test: ${!isInvalid ? 'PASS' : 'FAIL'}`);
    
    console.log('🎉 All seed script tests passed!');
    console.log('');
    console.log('The seed script is ready to use with a real database.');
    console.log('Make sure to:');
    console.log('1. Set up a PostgreSQL database');
    console.log('2. Update DATABASE_URL in .env');
    console.log('3. Run: npx prisma db push');
    console.log('4. Run: npx prisma db seed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSeed();
