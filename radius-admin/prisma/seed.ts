import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper function to create groups with their attributes
async function createGroupWithAttributes(
  groupName: string, 
  description: string, 
  attributes: {
    checks: Array<{ Attribute: string; op: string; Value: string }>
    replies: Array<{ Attribute: string; op: string; Value: string }>
  }
) {
  try {
    // Create group check attributes
    for (const check of attributes.checks) {
      // Check if this attribute already exists
      const existingCheck = await prisma.radGroupCheck.findFirst({
        where: {
          groupname: groupName,
          attribute: check.Attribute,
          op: check.op,
          value: check.Value
        }
      })

      if (!existingCheck) {
        await prisma.radGroupCheck.create({
          data: {
            groupname: groupName,
            attribute: check.Attribute,
            op: check.op,
            value: check.Value
          }
        })
      }
    }

    // Create group reply attributes
    for (const reply of attributes.replies) {
      // Check if this attribute already exists
      const existingReply = await prisma.radGroupReply.findFirst({
        where: {
          groupname: groupName,
          attribute: reply.Attribute,
          op: reply.op,
          value: reply.Value
        }
      })

      if (!existingReply) {
        await prisma.radGroupReply.create({
          data: {
            groupname: groupName,
            attribute: reply.Attribute,
            op: reply.op,
            value: reply.Value
          }
        })
      }
    }

    console.log(`   ✅ Created group: ${groupName} (${description})`)
  } catch (error) {
    console.error(`   ❌ Error creating group ${groupName}:`, error)
    throw error
  }
}

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

    // Create default FreeRADIUS groups with common attributes
    console.log('🔧 Creating default FreeRADIUS groups...')

    // 1. Full Access Group - Unrestricted access
    await createGroupWithAttributes('fullaccess', 'Full Access Users', {
      checks: [
        { Attribute: 'Auth-Type', op: ':=', Value: 'Accept' }
      ],
      replies: [
        { Attribute: 'Service-Type', op: ':=', Value: 'Framed-User' },
        { Attribute: 'Framed-Protocol', op: ':=', Value: 'PPP' },
        { Attribute: 'Reply-Message', op: '=', Value: 'Welcome, Full Access User' }
      ]
    })

    // 2. VPN Users Group - VPN access with session limits
    await createGroupWithAttributes('vpn-users', 'VPN Users', {
      checks: [
        { Attribute: 'Auth-Type', op: ':=', Value: 'Accept' }
      ],
      replies: [
        { Attribute: 'Service-Type', op: ':=', Value: 'Framed-User' },
        { Attribute: 'Framed-Protocol', op: ':=', Value: 'PPP' },
        { Attribute: 'Framed-IP-Netmask', op: ':=', Value: '255.255.255.0' },
        { Attribute: 'Session-Timeout', op: ':=', Value: '3600' },
        { Attribute: 'Idle-Timeout', op: ':=', Value: '1800' },
        { Attribute: 'Reply-Message', op: '=', Value: 'Welcome, VPN User' }
      ]
    })

    // 3. Guest Users Group - Limited access with restrictions
    await createGroupWithAttributes('guest-users', 'Guest Users', {
      checks: [
        { Attribute: 'Auth-Type', op: ':=', Value: 'Accept' }
      ],
      replies: [
        { Attribute: 'Service-Type', op: ':=', Value: 'Framed-User' },
        { Attribute: 'Framed-Protocol', op: ':=', Value: 'PPP' },
        { Attribute: 'Session-Timeout', op: ':=', Value: '1800' },
        { Attribute: 'Idle-Timeout', op: ':=', Value: '900' },
        { Attribute: 'Framed-Filter-Id', op: ':=', Value: 'guest-filter' },
        { Attribute: 'Reply-Message', op: '=', Value: 'Welcome, Guest User' }
      ]
    })

    // 4. Admin Users Group - Administrative access
    await createGroupWithAttributes('admin-users', 'Administrative Users', {
      checks: [
        { Attribute: 'Auth-Type', op: ':=', Value: 'Accept' }
      ],
      replies: [
        { Attribute: 'Service-Type', op: ':=', Value: 'Administrative-User' },
        { Attribute: 'Framed-Protocol', op: ':=', Value: 'PPP' },
        { Attribute: 'Session-Timeout', op: ':=', Value: '7200' },
        { Attribute: 'Idle-Timeout', op: ':=', Value: '3600' },
        { Attribute: 'Reply-Message', op: '=', Value: 'Welcome, Administrative User' }
      ]
    })

    // 5. Wireless Users Group - WiFi access with specific settings
    await createGroupWithAttributes('wireless-users', 'Wireless Users', {
      checks: [
        { Attribute: 'Auth-Type', op: ':=', Value: 'Accept' }
      ],
      replies: [
        { Attribute: 'Service-Type', op: ':=', Value: 'Framed-User' },
        { Attribute: 'Framed-Protocol', op: ':=', Value: 'PPP' },
        { Attribute: 'WISPr-Location-ID', op: ':=', Value: 'wireless-zone' },
        { Attribute: 'WISPr-Location-Name', op: ':=', Value: 'Wireless Network' },
        { Attribute: 'Session-Timeout', op: ':=', Value: '28800' },
        { Attribute: 'Idle-Timeout', op: ':=', Value: '1800' },
        { Attribute: 'Reply-Message', op: '=', Value: 'Welcome, Wireless User' }
      ]
    })

    // 6. Dial-up Users Group - Traditional dial-up access
    await createGroupWithAttributes('dialup-users', 'Dial-up Users', {
      checks: [
        { Attribute: 'Auth-Type', op: ':=', Value: 'Accept' }
      ],
      replies: [
        { Attribute: 'Service-Type', op: ':=', Value: 'Framed-User' },
        { Attribute: 'Framed-Protocol', op: ':=', Value: 'PPP' },
        { Attribute: 'Framed-IP-Netmask', op: ':=', Value: '255.255.255.0' },
        { Attribute: 'Session-Timeout', op: ':=', Value: '14400' },
        { Attribute: 'Idle-Timeout', op: ':=', Value: '1200' },
        { Attribute: 'Reply-Message', op: '=', Value: 'Welcome, Dial-up User' }
      ]
    })

    // 7. Test Users Group - For testing purposes
    await createGroupWithAttributes('test-users', 'Test Users', {
      checks: [
        { Attribute: 'Auth-Type', op: ':=', Value: 'Accept' }
      ],
      replies: [
        { Attribute: 'Service-Type', op: ':=', Value: 'Framed-User' },
        { Attribute: 'Framed-Protocol', op: ':=', Value: 'PPP' },
        { Attribute: 'Session-Timeout', op: ':=', Value: '300' },
        { Attribute: 'Idle-Timeout', op: ':=', Value: '60' },
        { Attribute: 'Reply-Message', op: '=', Value: 'Welcome, Test User' }
      ]
    })

    // 8. Restricted Users Group - Heavily restricted access
    await createGroupWithAttributes('restricted-users', 'Restricted Users', {
      checks: [
        { Attribute: 'Auth-Type', op: ':=', Value: 'Accept' }
      ],
      replies: [
        { Attribute: 'Service-Type', op: ':=', Value: 'Framed-User' },
        { Attribute: 'Framed-Protocol', op: ':=', Value: 'PPP' },
        { Attribute: 'Session-Timeout', op: ':=', Value: '600' },
        { Attribute: 'Idle-Timeout', op: ':=', Value: '300' },
        { Attribute: 'Framed-Filter-Id', op: ':=', Value: 'restricted-filter' },
        { Attribute: 'Reply-Message', op: '=', Value: 'Welcome, Restricted User' }
      ]
    })

    console.log('✅ Default FreeRADIUS groups created successfully!')
    console.log('   - fullaccess: Full Access Users')
    console.log('   - vpn-users: VPN Users')
    console.log('   - guest-users: Guest Users')
    console.log('   - admin-users: Administrative Users')
    console.log('   - wireless-users: Wireless Users')
    console.log('   - dialup-users: Dial-up Users')
    console.log('   - test-users: Test Users')
    console.log('   - restricted-users: Restricted Users')

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
    console.log('')
    console.log('Default groups are now available in the Groups management section!')

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
