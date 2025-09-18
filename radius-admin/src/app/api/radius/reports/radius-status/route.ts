import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/reports/radius-status - Get RADIUS status information
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for demonstration - in production, this would query the actual services
    const mockRadiusStatus = {
      freeradius: {
        status: "running",
        version: "3.0.21",
        pid: 1234,
        uptime: 86400 + 3600, // 1 day, 1 hour
        port: 1812,
        last_restart: new Date(Date.now() - 86400000 - 3600000).toISOString()
      },
      database: {
        status: "connected",
        type: "PostgreSQL",
        version: "13.4",
        host: "localhost",
        port: 5432,
        database: "radius",
        uptime: 86400 + 7200, // 1 day, 2 hours
        last_connection: new Date(Date.now() - 86400000 - 7200000).toISOString()
      },
      services: [
        {
          name: "freeradius",
          status: "running",
          pid: 1234,
          uptime: 86400 + 3600,
          last_restart: new Date(Date.now() - 86400000 - 3600000).toISOString()
        },
        {
          name: "postgresql",
          status: "running",
          pid: 5678,
          uptime: 86400 + 7200,
          last_restart: new Date(Date.now() - 86400000 - 7200000).toISOString()
        },
        {
          name: "nginx",
          status: "running",
          pid: 9012,
          uptime: 86400 + 1800,
          last_restart: new Date(Date.now() - 86400000 - 1800000).toISOString()
        },
        {
          name: "redis",
          status: "running",
          pid: 3456,
          uptime: 86400 + 900,
          last_restart: new Date(Date.now() - 86400000 - 900000).toISOString()
        }
      ],
      statistics: {
        total_requests: 15420,
        successful_requests: 14850,
        failed_requests: 570,
        active_sessions: 45,
        total_users: 250,
        last_request: new Date(Date.now() - 300000).toISOString()
      },
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(mockRadiusStatus)
  } catch (error) {
    console.error("Error fetching RADIUS status:", error)
    return NextResponse.json(
      { error: "Failed to fetch RADIUS status" },
      { status: 500 }
    )
  }
}
