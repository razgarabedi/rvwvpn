import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// POST /api/radius/accounting/hotspots/compare - Compare accounting data for selected hotspots
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { hotspot_ids, start_date, end_date } = body

    if (!hotspot_ids || !Array.isArray(hotspot_ids) || hotspot_ids.length < 2) {
      return NextResponse.json({ error: "At least 2 hotspot IDs are required for comparison" }, { status: 400 })
    }

    if (!start_date || !end_date) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    // Mock data for demonstration - in production, this would query the actual database
    const mockComparison = [
      {
        hotspot_id: 1,
        hotspot_name: "Main Lobby WiFi",
        hotspot_ip: "192.168.1.100",
        unique_users: 45,
        total_hits: 234,
        average_time: 1800, // 30 minutes
        total_time: 81000, // 22.5 hours
        last_activity: new Date(Date.now() - 300000).toISOString(),
        status: "active",
        efficiency_score: 85,
        user_retention: 78
      },
      {
        hotspot_id: 2,
        hotspot_name: "Conference Room WiFi",
        hotspot_ip: "192.168.1.101",
        unique_users: 23,
        total_hits: 89,
        average_time: 2400, // 40 minutes
        total_time: 21600, // 6 hours
        last_activity: new Date(Date.now() - 900000).toISOString(),
        status: "active",
        efficiency_score: 92,
        user_retention: 65
      },
      {
        hotspot_id: 3,
        hotspot_name: "Guest WiFi",
        hotspot_ip: "192.168.1.102",
        unique_users: 67,
        total_hits: 456,
        average_time: 1200, // 20 minutes
        total_time: 54000, // 15 hours
        last_activity: new Date(Date.now() - 1800000).toISOString(),
        status: "active",
        efficiency_score: 78,
        user_retention: 82
      },
      {
        hotspot_id: 6,
        hotspot_name: "Outdoor WiFi",
        hotspot_ip: "192.168.1.105",
        unique_users: 89,
        total_hits: 567,
        average_time: 1500, // 25 minutes
        total_time: 135000, // 37.5 hours
        last_activity: new Date(Date.now() - 600000).toISOString(),
        status: "active",
        efficiency_score: 88,
        user_retention: 75
      }
    ]

    // Filter results based on requested hotspot IDs
    const filteredResults = mockComparison.filter(hotspot => 
      hotspot_ids.includes(hotspot.hotspot_id)
    )

    return NextResponse.json(filteredResults)
  } catch (error) {
    console.error("Error comparing hotspots:", error)
    return NextResponse.json(
      { error: "Failed to compare hotspots" },
      { status: 500 }
    )
  }
}
