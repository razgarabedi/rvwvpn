const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Build Configuration...')
console.log('==================================')

// Test 1: Check if Prisma schema is valid
console.log('\n📋 Testing Prisma Schema...')
try {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  // Check for lowercase column names
  const hasLowercaseColumns = schema.includes('username: String') && 
                             schema.includes('attribute: String') && 
                             schema.includes('value: String')
  
  if (hasLowercaseColumns) {
    console.log('✅ Prisma schema uses lowercase column names')
  } else {
    console.log('❌ Prisma schema still has PascalCase column names')
  }
  
  // Check for @map directives (should be removed)
  const hasMapDirectives = schema.includes('@map(')
  if (!hasMapDirectives) {
    console.log('✅ Prisma schema has no @map directives (correct)')
  } else {
    console.log('❌ Prisma schema still has @map directives')
  }
  
} catch (error) {
  console.log('❌ Error reading Prisma schema:', error.message)
}

// Test 2: Check API routes
console.log('\n📋 Testing API Routes...')
const apiRoutes = [
  'src/app/api/radius/users/route.ts',
  'src/app/api/radius/users/[id]/route.ts',
  'src/app/api/radius/groups/route.ts',
  'src/app/api/radius/users/assign-group/route.ts',
  'src/app/api/radius/users/reply-attributes/route.ts'
]

apiRoutes.forEach(route => {
  try {
    const routePath = path.join(__dirname, '..', route)
    const content = fs.readFileSync(routePath, 'utf8')
    
    // Check for lowercase field names
    const hasLowercaseFields = content.includes('username:') && 
                              content.includes('attribute:') && 
                              content.includes('value:')
    
    if (hasLowercaseFields) {
      console.log(`✅ ${route} uses lowercase field names`)
    } else {
      console.log(`❌ ${route} may have incorrect field names`)
    }
  } catch (error) {
    console.log(`❌ Error reading ${route}:`, error.message)
  }
})

// Test 3: Check frontend components
console.log('\n📋 Testing Frontend Components...')
const frontendComponents = [
  'src/components/user-management.tsx',
  'src/components/enhanced-user-management.tsx'
]

frontendComponents.forEach(component => {
  try {
    const componentPath = path.join(__dirname, '..', component)
    const content = fs.readFileSync(componentPath, 'utf8')
    
    // Check for lowercase field names in interfaces
    const hasLowercaseInterfaces = content.includes('username: string') && 
                                  content.includes('attribute: string') && 
                                  content.includes('value: string')
    
    if (hasLowercaseInterfaces) {
      console.log(`✅ ${component} uses lowercase field names`)
    } else {
      console.log(`❌ ${component} may have incorrect field names`)
    }
  } catch (error) {
    console.log(`❌ Error reading ${component}:`, error.message)
  }
})

// Test 4: Check package.json
console.log('\n📋 Testing Package Configuration...')
try {
  const packagePath = path.join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  console.log(`✅ Package name: ${packageJson.name}`)
  console.log(`✅ Next.js version: ${packageJson.dependencies.next}`)
  console.log(`✅ Prisma version: ${packageJson.dependencies['@prisma/client']}`)
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message)
}

console.log('\n🎉 Build configuration test completed!')
console.log('\n💡 Next steps:')
console.log('1. Set up your DATABASE_URL in .env file')
console.log('2. Run: npx prisma generate')
console.log('3. Run: npm run build')
console.log('4. Test the application')
