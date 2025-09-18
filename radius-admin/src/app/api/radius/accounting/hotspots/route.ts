import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/accounting/hotspots - Get accounting data for all hotspots
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start")
    const endDate = searchParams.get("end")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    // Mock data for demonstration - in production, this would query the actual database
    const mockHotspotsAccounting = [
      {
        hotspot_id: 1,
        hotspot_name: "Main Lobby WiFi",
        hotspot_ip: "192.168.1.100",
        unique_users: 45,
        total_hits: 234,
        average_time: 1800, // 30 minutes
        total_time: 81000, // 22.5 hours
        last_activity: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        status: "active"
      },
      {
        hotspot_id: 2,
        hotspot_name: "Conference Room WiFi",
        hotspot_ip: "192.168.1.101",
        unique_users: 23,
        total_hits: 89,
        average_time: 2400, // 40 minutes
        total_time: 21600, // 6 hours
        last_activity: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        status: "active"
      },
      {
        hotspot_id: 3,
        hotspot_name: "Guest WiFi",
        hotspot_ip: "192.168.1.102",
        unique_users: 67,
        total_hits: 456,
        average_time: 1200, // 20 minutes
        total_time: 54000, // 15 hours
        last_activity: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        status: "active"
      },
      {
        hotspot_id: 4,
        hotspot_name: "Cafeteria WiFi",
        hotspot_ip: "192.168.1.103",
        unique_users: 34,
        total_hits: 123,
        average_time: 900, // 15 minutes
        total_time: 10800, // 3 hours
        last_activity: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        status: "inactive"
      },
      {
        hotspot_id: 5,
        hotspot_name: "Library WiFi",
        hotspot_ip: "192.168.1.104",
        unique_users: 12,
        total_hits: 45,
        average_time: 3600, // 1 hour
        total_time: 16200, // 4.5 hours
        last_activity: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        status: "maintenance"
      },
      {
        hotspot_id: 6,
        hotspot_name: "Outdoor WiFi",
        hotspot_ip: "192.168.1.105",
        unique_users: 89,
        total_hits: 567,
        average_time: 1500, // 25 minutes
        total_time: 135000, // 37.5 hours
        last_activity: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        status: "active"
      }
    ]

    return NextResponse.json(mockHotspotsAccounting)
  } catch (error) {
    console.error("Error fetching hotspots accounting data:", error)
    return NextResponse.json(
      { error: "Failed to fetch hotspots accounting data" },
      { status: 500 }
    )
  }
}
