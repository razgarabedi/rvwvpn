const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding default NAS devices...')

  try {
    // Default NAS devices for common scenarios
    const defaultNASDevices = [
      {
        nasname: '192.168.1.1',
        shortname: 'office-router',
        type: 'cisco',
        ports: 1812,
        secret: 'cisco-secret-123',
        server: 'radius.example.com',
        community: 'public',
        description: 'Main office Cisco router'
      },
      {
        nasname: '192.168.1.10',
        shortname: 'wifi-controller',
        type: 'cisco',
        ports: 1812,
        secret: 'wifi-secret-456',
        server: 'radius.example.com',
        community: 'public',
        description: 'Wireless LAN Controller'
      },
      {
        nasname: '10.0.0.1',
        shortname: 'vpn-gateway',
        type: 'fortinet',
        ports: 1812,
        secret: 'vpn-secret-789',
        server: 'radius.example.com',
        community: 'public',
        description: 'VPN Gateway - FortiGate'
      },
      {
        nasname: '192.168.2.1',
        shortname: 'branch-router',
        type: 'mikrotik',
        ports: 1812,
        secret: 'mikrotik-secret-101',
        server: 'radius.example.com',
        community: 'public',
        description: 'Branch office MikroTik router'
      },
      {
        nasname: '172.16.0.1',
        shortname: 'guest-wifi',
        type: 'openwrt',
        ports: 1812,
        secret: 'guest-secret-202',
        server: 'radius.example.com',
        community: 'public',
        description: 'Guest WiFi access point'
      },
      {
        nasname: '192.168.100.1',
        shortname: 'test-nas',
        type: 'other',
        ports: 1812,
        secret: 'test-secret-303',
        server: 'radius.example.com',
        community: 'public',
        description: 'Test NAS device for development'
      }
    ]

    for (const nasDevice of defaultNASDevices) {
      try {
        await prisma.nas.upsert({
          where: {
            nasname: nasDevice.nasname
          },
          update: {
            shortname: nasDevice.shortname,
            type: nasDevice.type,
            ports: nasDevice.ports,
            secret: nasDevice.secret,
            server: nasDevice.server,
            community: nasDevice.community,
            description: nasDevice.description
          },
          create: nasDevice
        })
        console.log(`   ✅ Created/updated NAS: ${nasDevice.shortname} (${nasDevice.nasname})`)
      } catch (error) {
        console.error(`   ❌ Error creating NAS ${nasDevice.shortname}:`, error)
      }
    }

    console.log('✅ Default NAS devices created successfully!')
    console.log('   - office-router: Main office Cisco router')
    console.log('   - wifi-controller: Wireless LAN Controller')
    console.log('   - vpn-gateway: VPN Gateway - FortiGate')
    console.log('   - branch-router: Branch office MikroTik router')
    console.log('   - guest-wifi: Guest WiFi access point')
    console.log('   - test-nas: Test NAS device for development')

  } catch (error) {
    console.error('❌ Error during NAS seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

main()
  .catch((error) => {
    console.error('💥 NAS seeding failed:', error)
    process.exit(1)
  })
