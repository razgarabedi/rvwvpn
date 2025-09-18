import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/reports/radius-server-log - Get FreeRADIUS server log entries
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for demonstration - in production, this would query the actual database
    const mockLogEntries = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: "INFO",
        component: "radiusd",
        message: "Ready to process requests",
        user: "system",
        nas_ip: "192.168.1.1",
        session_id: "sess_001",
        request_id: "req_001",
        details: "FreeRADIUS server started successfully"
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        level: "INFO",
        component: "auth",
        message: "Login OK: [john.doe] (from client office-router port 1812 cli 192.168.1.100)",
        user: "john.doe",
        nas_ip: "192.168.1.1",
        session_id: "sess_002",
        request_id: "req_002",
        details: "User authentication successful"
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        level: "WARN",
        component: "auth",
        message: "No such user: [invalid.user] (from client office-router port 1812 cli 192.168.1.101)",
        user: "invalid.user",
        nas_ip: "192.168.1.1",
        session_id: null,
        request_id: "req_003",
        details: "Authentication failed - user not found"
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        level: "INFO",
        component: "acct",
        message: "Acct-Session-Id = \"sess_002\"",
        user: "john.doe",
        nas_ip: "192.168.1.1",
        session_id: "sess_002",
        request_id: "req_004",
        details: "Accounting start packet received"
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        level: "ERROR",
        component: "radiusd",
        message: "Failed to open dictionary file: /etc/freeradius/dictionary",
        user: "system",
        nas_ip: null,
        session_id: null,
        request_id: null,
        details: "Configuration error - dictionary file not found"
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        level: "INFO",
        component: "auth",
        message: "Login OK: [jane.smith] (from client guest-router port 1812 cli 192.168.1.102)",
        user: "jane.smith",
        nas_ip: "192.168.1.2",
        session_id: "sess_003",
        request_id: "req_005",
        details: "User authentication successful"
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 2100000).toISOString(),
        level: "DEBUG",
        component: "sql",
        message: "SQL query: SELECT * FROM radcheck WHERE username = 'john.doe'",
        user: "john.doe",
        nas_ip: "192.168.1.1",
        session_id: "sess_002",
        request_id: "req_006",
        details: "Database query executed"
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        level: "INFO",
        component: "acct",
        message: "Acct-Session-Id = \"sess_003\"",
        user: "jane.smith",
        nas_ip: "192.168.1.2",
        session_id: "sess_003",
        request_id: "req_007",
        details: "Accounting start packet received"
      },
      {
        id: 9,
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        level: "WARN",
        component: "auth",
        message: "Invalid password for user [admin] (from client office-router port 1812 cli 192.168.1.100)",
        user: "admin",
        nas_ip: "192.168.1.1",
        session_id: null,
        request_id: "req_008",
        details: "Authentication failed - invalid password"
      },
      {
        id: 10,
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        level: "INFO",
        component: "acct",
        message: "Acct-Session-Id = \"sess_002\"",
        user: "john.doe",
        nas_ip: "192.168.1.1",
        session_id: "sess_002",
        request_id: "req_009",
        details: "Accounting stop packet received"
      }
    ]

    return NextResponse.json(mockLogEntries)
  } catch (error) {
    console.error("Error fetching RADIUS server log entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch RADIUS server log entries" },
      { status: 500 }
    )
  }
}
