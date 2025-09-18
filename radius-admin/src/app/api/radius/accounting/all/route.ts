import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/accounting/all - Get all accounting records
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Mock data for demonstration - in production, this would query the actual database
    const mockRecords = [
      {
        id: 5001,
        username: "user1",
        nas_ip: "192.168.1.1",
        nas_name: "Main Router",
        framed_ip: "192.168.1.100",
        session_start: new Date(Date.now() - 3600000).toISOString(),
        session_end: new Date(Date.now() - 1800000).toISOString(),
        session_time: 1800,
        input_bytes: 104857600, // 100MB
        output_bytes: 52428800,  // 50MB
        input_packets: 1500,
        output_packets: 1200,
        status: "completed",
        termination_cause: "User-Request",
        nas_port: "1",
        calling_station_id: "00:11:22:33:44:55",
        called_station_id: "00:AA:BB:CC:DD:EE"
      },
      {
        id: 5002,
        username: "user2",
        nas_ip: "192.168.1.2",
        nas_name: "Secondary Router",
        framed_ip: "192.168.1.101",
        session_start: new Date(Date.now() - 7200000).toISOString(),
        session_end: null,
        session_time: 7200,
        input_bytes: 209715200, // 200MB
        output_bytes: 104857600, // 100MB
        input_packets: 3000,
        output_packets: 2500,
        status: "active",
        termination_cause: null,
        nas_port: "2",
        calling_station_id: "00:11:22:33:44:56",
        called_station_id: "00:AA:BB:CC:DD:FF"
      }
    ]

    const totalPages = Math.ceil(100 / limit) // Mock total pages

    return NextResponse.json({
      records: mockRecords,
      totalPages,
      currentPage: page,
      totalRecords: 100
    })
  } catch (error) {
    console.error("Error fetching all accounting records:", error)
    return NextResponse.json(
      { error: "Failed to fetch accounting records" },
      { status: 500 }
    )
  }
}
