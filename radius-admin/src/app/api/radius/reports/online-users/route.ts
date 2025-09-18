import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/reports/online-users - Get currently online users
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for demonstration - in production, this would query the actual database
    const mockOnlineUsers = [
      {
        id: 1,
        username: "john.doe",
        nas_ip: "192.168.1.1",
        nas_name: "Office Router",
        framed_ip: "10.0.1.100",
        calling_station_id: "00:11:22:33:44:55",
        called_station_id: "00:11:22:33:44:66",
        session_time: 3600,
        session_timeout: 7200,
        idle_timeout: 1800,
        bytes_in: 1048576,
        bytes_out: 2097152,
        packets_in: 1500,
        packets_out: 2000,
        start_time: new Date(Date.now() - 3600000).toISOString(),
        last_update: new Date().toISOString(),
        nas_port: 1812,
        session_id: "session_001"
      },
      {
        id: 2,
        username: "jane.smith",
        nas_ip: "192.168.1.2",
        nas_name: "Guest Router",
        framed_ip: "10.0.1.101",
        calling_station_id: "00:11:22:33:44:77",
        called_station_id: "00:11:22:33:44:88",
        session_time: 1800,
        session_timeout: 3600,
        idle_timeout: 900,
        bytes_in: 524288,
        bytes_out: 1048576,
        packets_in: 800,
        packets_out: 1200,
        start_time: new Date(Date.now() - 1800000).toISOString(),
        last_update: new Date().toISOString(),
        nas_port: 1812,
        session_id: "session_002"
      },
      {
        id: 3,
        username: "admin",
        nas_ip: "192.168.1.1",
        nas_name: "Office Router",
        framed_ip: "10.0.1.102",
        calling_station_id: "00:11:22:33:44:99",
        called_station_id: "00:11:22:33:44:AA",
        session_time: 7200,
        session_timeout: 14400,
        idle_timeout: 3600,
        bytes_in: 2097152,
        bytes_out: 4194304,
        packets_in: 3000,
        packets_out: 4000,
        start_time: new Date(Date.now() - 7200000).toISOString(),
        last_update: new Date().toISOString(),
        nas_port: 1812,
        session_id: "session_003"
      }
    ]

    return NextResponse.json(mockOnlineUsers)
  } catch (error) {
    console.error("Error fetching online users:", error)
    return NextResponse.json(
      { error: "Failed to fetch online users" },
      { status: 500 }
    )
  }
}
