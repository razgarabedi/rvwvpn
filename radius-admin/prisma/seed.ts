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

    // Create default FreeRADIUS server configuration
    const defaultServer = await prisma.radiusServerConfig.upsert({
      where: {
        name: 'Default RADIUS Server'
      },
      update: {
        host: '192.168.1.100',
        port: 1813,
        secret: 'testing123',
        description: 'Default FreeRADIUS server configuration',
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        name: 'Default RADIUS Server',
        host: '192.168.1.100',
        port: 1813,
        secret: 'testing123',
        description: 'Default FreeRADIUS server configuration',
        isActive: true
      }
    })

    console.log('✅ Default server configuration created/updated:')
    console.log(`   Name: ${defaultServer.name}`)
    console.log(`   Host: ${defaultServer.host}:${defaultServer.port}`)
    console.log(`   Active: ${defaultServer.isActive}`)

    console.log('🎉 Database seeding completed successfully!')
    console.log('')
    console.log('You can now log in with:')
    console.log('   Email: admin@example.com')
    console.log('   Password: adminpassword123')
    console.log('')
    console.log('Default FreeRADIUS server configuration:')
    console.log('   Host: 192.168.1.100:1813')
    console.log('   Secret: testing123')
    console.log('   (Update these values in the admin dashboard)')

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
