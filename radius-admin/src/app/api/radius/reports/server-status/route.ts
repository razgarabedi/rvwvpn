import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/reports/server-status - Get server status information
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for demonstration - in production, this would query the actual system
    const mockServerStatus = {
      hostname: "radius-server",
      os: "Ubuntu 20.04.3 LTS",
      kernel: "5.4.0-74-generic",
      uptime: 86400 + 3600 + 1800, // 1 day, 1 hour, 30 minutes
      cpu: {
        usage: 45.2,
        cores: 8,
        model: "Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz",
        temperature: 65
      },
      memory: {
        total: 17179869184, // 16GB
        used: 8589934592,   // 8GB
        free: 8589934592,   // 8GB
        cached: 2147483648, // 2GB
        swap_total: 4294967296, // 4GB
        swap_used: 0
      },
      disk: {
        total: 107374182400, // 100GB
        used: 53687091200,   // 50GB
        free: 53687091200,   // 50GB
        usage_percent: 50.0
      },
      network: {
        interfaces: [
          {
            name: "eth0",
            status: "up",
            rx_bytes: 1073741824, // 1GB
            tx_bytes: 2147483648, // 2GB
            ip_address: "192.168.1.10"
          },
          {
            name: "eth1",
            status: "up",
            rx_bytes: 536870912,  // 512MB
            tx_bytes: 1073741824, // 1GB
            ip_address: "10.0.0.10"
          },
          {
            name: "lo",
            status: "up",
            rx_bytes: 134217728,  // 128MB
            tx_bytes: 134217728,  // 128MB
            ip_address: "127.0.0.1"
          }
        ]
      },
      load_average: {
        one_minute: 0.45,
        five_minutes: 0.52,
        fifteen_minutes: 0.48
      },
      processes: {
        total: 156,
        running: 3,
        sleeping: 150,
        zombie: 0
      },
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(mockServerStatus)
  } catch (error) {
    console.error("Error fetching server status:", error)
    return NextResponse.json(
      { error: "Failed to fetch server status" },
      { status: 500 }
    )
  }
}
