import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/reports/connection-attempts - Get recent connection attempts
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for demonstration - in production, this would query the actual database
    const mockConnectionAttempts = [
      {
        id: 1,
        username: "john.doe",
        nas_ip: "192.168.1.1",
        nas_name: "Office Router",
        framed_ip: "10.0.1.100",
        calling_station_id: "00:11:22:33:44:55",
        called_station_id: "00:11:22:33:44:66",
        reply: "Access-Accept",
        authdate: new Date(Date.now() - 300000).toISOString(),
        acctstarttime: new Date(Date.now() - 300000).toISOString(),
        acctstoptime: null,
        acctsessiontime: 3600,
        acctinputoctets: 1048576,
        acctoutputoctets: 2097152,
        acctterminatecause: null,
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
        reply: "Access-Accept",
        authdate: new Date(Date.now() - 600000).toISOString(),
        acctstarttime: new Date(Date.now() - 600000).toISOString(),
        acctstoptime: null,
        acctsessiontime: 1800,
        acctinputoctets: 524288,
        acctoutputoctets: 1048576,
        acctterminatecause: null,
        nas_port: 1812,
        session_id: "session_002"
      },
      {
        id: 3,
        username: "invalid.user",
        nas_ip: "192.168.1.1",
        nas_name: "Office Router",
        framed_ip: null,
        calling_station_id: "00:11:22:33:44:BB",
        called_station_id: "00:11:22:33:44:CC",
        reply: "Access-Reject",
        authdate: new Date(Date.now() - 900000).toISOString(),
        acctstarttime: null,
        acctstoptime: null,
        acctsessiontime: 0,
        acctinputoctets: 0,
        acctoutputoctets: 0,
        acctterminatecause: "Invalid credentials",
        nas_port: 1812,
        session_id: null
      },
      {
        id: 4,
        username: "challenge.user",
        nas_ip: "192.168.1.3",
        nas_name: "VPN Gateway",
        framed_ip: null,
        calling_station_id: "00:11:22:33:44:DD",
        called_station_id: "00:11:22:33:44:EE",
        reply: "Access-Challenge",
        authdate: new Date(Date.now() - 1200000).toISOString(),
        acctstarttime: null,
        acctstoptime: null,
        acctsessiontime: 0,
        acctinputoctets: 0,
        acctoutputoctets: 0,
        acctterminatecause: "Challenge required",
        nas_port: 1812,
        session_id: null
      },
      {
        id: 5,
        username: "admin",
        nas_ip: "192.168.1.1",
        nas_name: "Office Router",
        framed_ip: "10.0.1.102",
        calling_station_id: "00:11:22:33:44:99",
        called_station_id: "00:11:22:33:44:AA",
        reply: "Access-Accept",
        authdate: new Date(Date.now() - 1800000).toISOString(),
        acctstarttime: new Date(Date.now() - 1800000).toISOString(),
        acctstoptime: null,
        acctsessiontime: 7200,
        acctinputoctets: 2097152,
        acctoutputoctets: 4194304,
        acctterminatecause: null,
        nas_port: 1812,
        session_id: "session_003"
      }
    ]

    return NextResponse.json(mockConnectionAttempts)
  } catch (error) {
    console.error("Error fetching connection attempts:", error)
    return NextResponse.json(
      { error: "Failed to fetch connection attempts" },
      { status: 500 }
    )
  }
}
