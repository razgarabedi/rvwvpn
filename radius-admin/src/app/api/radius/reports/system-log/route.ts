import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/reports/system-log - Get system log entries
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
        facility: "kern",
        severity: "INFO",
        hostname: "radius-server",
        program: "kernel",
        pid: 0,
        message: "Linux version 5.4.0-74-generic (buildd@lcy01-amd64-027) (gcc version 9.3.0 (Ubuntu 9.3.0-17ubuntu1~20.04)) #83-Ubuntu SMP Sat May 8 02:35:39 UTC 2021",
        source: "syslog"
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        facility: "daemon",
        severity: "INFO",
        hostname: "radius-server",
        program: "systemd",
        pid: 1,
        message: "Started FreeRADIUS server.",
        source: "syslog"
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        facility: "auth",
        severity: "INFO",
        hostname: "radius-server",
        program: "sshd",
        pid: 1234,
        message: "Accepted publickey for admin from 192.168.1.100 port 22 ssh2",
        source: "auth"
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        facility: "kern",
        severity: "WARNING",
        hostname: "radius-server",
        program: "kernel",
        pid: 0,
        message: "CPU0: Package temperature above threshold, cpu clock throttled",
        source: "kern"
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        facility: "daemon",
        severity: "ERR",
        hostname: "radius-server",
        program: "freeradius",
        pid: 5678,
        message: "Failed to bind to port 1812: Address already in use",
        source: "daemon"
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        facility: "mail",
        severity: "INFO",
        hostname: "radius-server",
        program: "postfix",
        pid: 2345,
        message: "delivered to mailbox: admin@radius-server.local",
        source: "mail"
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 2100000).toISOString(),
        facility: "kern",
        severity: "INFO",
        hostname: "radius-server",
        program: "kernel",
        pid: 0,
        message: "eth0: link up",
        source: "kern"
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        facility: "daemon",
        severity: "INFO",
        hostname: "radius-server",
        program: "freeradius",
        pid: 5678,
        message: "Ready to process requests",
        source: "daemon"
      },
      {
        id: 9,
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        facility: "auth",
        severity: "WARNING",
        hostname: "radius-server",
        program: "sshd",
        pid: 1234,
        message: "Failed password for admin from 192.168.1.101 port 22 ssh2",
        source: "auth"
      },
      {
        id: 10,
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        facility: "kern",
        severity: "INFO",
        hostname: "radius-server",
        program: "kernel",
        pid: 0,
        message: "ACPI: PM: Machine is now ready to resume from suspend-to-RAM",
        source: "kern"
      }
    ]

    return NextResponse.json(mockLogEntries)
  } catch (error) {
    console.error("Error fetching system log entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch system log entries" },
      { status: 500 }
    )
  }
}
