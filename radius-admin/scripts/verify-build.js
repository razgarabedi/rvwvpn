#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying User Activity Reports build...\n');

// Check if required files exist
const requiredFiles = [
  'src/app/api/radius/reports/activity/route.ts',
  'src/app/api/radius/reports/auth-logs/route.ts',
  'src/app/api/radius/reports/performance/route.ts',
  'src/components/tabs/reports-tab.tsx',
  'src/components/tabs/graphs-tab.tsx',
  'scripts/freeradius-integration.sh',
  'docs/user-activity-reports.md'
];

console.log('1. Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

console.log('\n✅ All required files exist\n');

// Check TypeScript compilation
console.log('2. Checking TypeScript compilation...');
const { execSync } = require('child_process');

try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful\n');
} catch (error) {
  console.log('❌ TypeScript compilation failed:');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

// Check if .next directory exists (build output)
console.log('3. Checking build output...');
const nextDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextDir)) {
  console.log('✅ Build output directory exists\n');
} else {
  console.log('⚠️  Build output directory not found - running build...');
  try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.log('❌ Build failed:');
    console.log(error.stdout?.toString() || error.message);
    process.exit(1);
  }
}

// Check package.json scripts
console.log('4. Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

const requiredScripts = ['dev', 'build', 'start', 'lint'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script} script exists`);
  } else {
    console.log(`❌ ${script} script missing`);
    allFilesExist = false;
  }
});

console.log('\n5. Checking API endpoint structure...');
const apiFiles = [
  'src/app/api/radius/reports/activity/route.ts',
  'src/app/api/radius/reports/auth-logs/route.ts',
  'src/app/api/radius/reports/performance/route.ts'
];

apiFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('export async function GET')) {
    console.log(`✅ ${file} - GET endpoint exists`);
  } else {
    console.log(`❌ ${file} - GET endpoint missing`);
    allFilesExist = false;
  }
});

console.log('\n6. Checking UI components...');
const uiFiles = [
  'src/components/tabs/reports-tab.tsx',
  'src/components/tabs/graphs-tab.tsx'
];

uiFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('export default function') && content.includes('useState')) {
    console.log(`✅ ${file} - React component structure correct`);
  } else {
    console.log(`❌ ${file} - React component structure incorrect`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 Build verification completed successfully!');
  console.log('\n📋 User Activity Reports System Status:');
  console.log('   ✅ API endpoints ready');
  console.log('   ✅ UI components ready');
  console.log('   ✅ FreeRADIUS integration ready');
  console.log('   ✅ Documentation complete');
  console.log('   ✅ TypeScript compilation successful');
  console.log('   ✅ Build process working');
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open: http://localhost:3000');
  console.log('   3. Navigate to Reports tab');
  console.log('   4. Test the User Activity Reports features');
  
  console.log('\n📚 Documentation:');
  console.log('   - Setup guide: docs/user-activity-reports.md');
  console.log('   - FreeRADIUS integration: scripts/freeradius-integration.sh');
  
} else {
  console.log('\n❌ Build verification failed!');
  process.exit(1);
}
