import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Hash the admin password
    const hashedPassword = await bcrypt.hash('adminpassword123', 12)
    console.log('✅ Password hashed successfully')

    // Create or update admin user
    const adminUser = await prisma.adminUser.upsert({
      where: {
        email: 'admin@example.com'
      },
      update: {
        password: hashedPassword,
        updatedAt: new Date()
      },
      create: {
        email: 'admin@example.com',
        password: hashedPassword
      }
    })

    console.log('✅ Admin user created/updated successfully:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   ID: ${adminUser.id}`)
    console.log(`   Created: ${adminUser.createdAt}`)
    console.log(`   Updated: ${adminUser.updatedAt}`)

    console.log('🎉 Database seeding completed successfully!')
    console.log('')
    console.log('You can now log in with:')
    console.log('   Email: admin@example.com')
    console.log('   Password: adminpassword123')

  } catch (error) {
    console.error('❌ Error during database seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

main()
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })
