const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Helper function to create groups with their attributes
async function createGroupWithAttributes(
  groupName, 
  description, 
  attributes
) {
  try {
    console.log(`Creating group: ${groupName} (${description})`)

    // Create group check attributes
    for (const check of attributes.checks) {
      await prisma.radGroupCheck.upsert({
        where: {
          GroupName_Attribute_op_Value: {
            GroupName: groupName,
            Attribute: check.Attribute,
            op: check.op,
            Value: check.Value
          }
        },
        update: {},
        create: {
          GroupName: groupName,
          Attribute: check.Attribute,
          op: check.op,
          Value: check.Value
        }
      })
    }

    // Create group reply attributes
    for (const reply of attributes.replies) {
      await prisma.radGroupReply.upsert({
        where: {
          GroupName_Attribute_op_Value: {
            GroupName: groupName,
            Attribute: reply.Attribute,
            op: reply.op,
            Value: reply.Value
          }
        },
        update: {},
        create: {
          GroupName: groupName,
          Attribute: reply.Attribute,
          op: reply.op,
          Value: reply.Value
        }
      })
    }

    console.log(`   ✅ Created group: ${groupName}`)
  } catch (error) {
    console.error(`   ❌ Error creating group ${groupName}:`, error)
    throw error
  }
}

async function main() {
  console.log('🌱 Seeding default FreeRADIUS groups...')

  try {
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

  } catch (error) {
    console.error('❌ Error during group seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

main()
  .catch((error) => {
    console.error('💥 Group seeding failed:', error)
    process.exit(1)
  })
