import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/reports/daloradius-log - Get daloRADIUS interface log entries
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
        user: "admin",
        action: "create",
        resource: "user",
        details: "Created new user: john.doe",
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_001"
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        user: "admin",
        action: "delete",
        resource: "hotspot",
        details: "Deleted hotspot: Guest-WiFi",
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_001"
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        user: "operator",
        action: "update",
        resource: "nas",
        details: "Updated NAS device: Office Router",
        ip_address: "192.168.1.101",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_002"
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        user: "admin",
        action: "login",
        resource: "system",
        details: "User logged in successfully",
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_001"
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        user: "operator",
        action: "create",
        resource: "group",
        details: "Created new group: office-users",
        ip_address: "192.168.1.101",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_002"
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        user: "admin",
        action: "delete",
        resource: "user",
        details: "Failed to delete user: invalid.user - User not found",
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "error",
        session_id: "sess_001"
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 2100000).toISOString(),
        user: "operator",
        action: "update",
        resource: "user",
        details: "Updated user password for: jane.smith",
        ip_address: "192.168.1.101",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_002"
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        user: "admin",
        action: "create",
        resource: "hotspot",
        details: "Created new hotspot: Conference Room WiFi",
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_001"
      },
      {
        id: 9,
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        user: "operator",
        action: "search",
        resource: "users",
        details: "Searched for users with criteria: group=office-users",
        ip_address: "192.168.1.101",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_002"
      },
      {
        id: 10,
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        user: "admin",
        action: "logout",
        resource: "system",
        details: "User logged out",
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "success",
        session_id: "sess_001"
      }
    ]

    return NextResponse.json(mockLogEntries)
  } catch (error) {
    console.error("Error fetching daloRADIUS log entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch daloRADIUS log entries" },
      { status: 500 }
    )
  }
}
