import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/accounting/active - Get active accounting records
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for demonstration - in production, this would query the actual database
    const mockRecords = [
      {
        id: 6001,
        username: "user1",
        nas_ip: "192.168.1.1",
        nas_name: "Main Router",
        framed_ip: "192.168.1.100",
        session_start: new Date(Date.now() - 3600000).toISOString(),
        session_time: 3600,
        input_bytes: 104857600, // 100MB
        output_bytes: 52428800,  // 50MB
        input_packets: 1500,
        output_packets: 1200,
        nas_port: "1",
        calling_station_id: "00:11:22:33:44:55",
        called_station_id: "00:AA:BB:CC:DD:EE",
        max_all_session: 86400, // 24 hours
        expiration: new Date(Date.now() + 82800000).toISOString(), // 23 hours from now
        last_update: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      },
      {
        id: 6002,
        username: "user2",
        nas_ip: "192.168.1.2",
        nas_name: "Secondary Router",
        framed_ip: "192.168.1.101",
        session_start: new Date(Date.now() - 7200000).toISOString(),
        session_time: 7200,
        input_bytes: 209715200, // 200MB
        output_bytes: 104857600, // 100MB
        input_packets: 3000,
        output_packets: 2500,
        nas_port: "2",
        calling_station_id: "00:11:22:33:44:56",
        called_station_id: "00:AA:BB:CC:DD:FF",
        max_all_session: 43200, // 12 hours
        expiration: new Date(Date.now() + 36000000).toISOString(), // 10 hours from now
        last_update: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
      }
    ]

    return NextResponse.json(mockRecords)
  } catch (error) {
    console.error("Error fetching active accounting records:", error)
    return NextResponse.json(
      { error: "Failed to fetch active accounting records" },
      { status: 500 }
    )
  }
}
