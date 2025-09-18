import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/reports/top-users - Get top users by usage
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get("time") || "7d"
    const sortBy = searchParams.get("sort") || "bandwidth"
    const limit = parseInt(searchParams.get("limit") || "10")

    // Mock data for demonstration - in production, this would query the actual database
    const mockTopUsers = [
      {
        id: 1,
        username: "admin",
        total_bytes_in: 10737418240, // 10 GB
        total_bytes_out: 21474836480, // 20 GB
        total_bytes: 32212254720, // 30 GB
        total_session_time: 259200, // 72 hours
        total_sessions: 45,
        last_activity: new Date(Date.now() - 3600000).toISOString(),
        avg_session_time: 5760, // 1.6 hours
        peak_usage_time: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 2,
        username: "john.doe",
        total_bytes_in: 5368709120, // 5 GB
        total_bytes_out: 10737418240, // 10 GB
        total_bytes: 16106127360, // 15 GB
        total_session_time: 172800, // 48 hours
        total_sessions: 32,
        last_activity: new Date(Date.now() - 1800000).toISOString(),
        avg_session_time: 5400, // 1.5 hours
        peak_usage_time: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: 3,
        username: "jane.smith",
        total_bytes_in: 2684354560, // 2.5 GB
        total_bytes_out: 5368709120, // 5 GB
        total_bytes: 8053063680, // 7.5 GB
        total_session_time: 86400, // 24 hours
        total_sessions: 28,
        last_activity: new Date(Date.now() - 900000).toISOString(),
        avg_session_time: 3085, // 51 minutes
        peak_usage_time: new Date(Date.now() - 21600000).toISOString()
      },
      {
        id: 4,
        username: "developer",
        total_bytes_in: 1073741824, // 1 GB
        total_bytes_out: 2147483648, // 2 GB
        total_bytes: 3221225472, // 3 GB
        total_session_time: 43200, // 12 hours
        total_sessions: 15,
        last_activity: new Date(Date.now() - 450000).toISOString(),
        avg_session_time: 2880, // 48 minutes
        peak_usage_time: new Date(Date.now() - 28800000).toISOString()
      },
      {
        id: 5,
        username: "guest.user",
        total_bytes_in: 536870912, // 512 MB
        total_bytes_out: 1073741824, // 1 GB
        total_bytes: 1610612736, // 1.5 GB
        total_session_time: 21600, // 6 hours
        total_sessions: 8,
        last_activity: new Date(Date.now() - 270000).toISOString(),
        avg_session_time: 2700, // 45 minutes
        peak_usage_time: new Date(Date.now() - 36000000).toISOString()
      }
    ]

    // Sort based on the sortBy parameter
    let sortedUsers = [...mockTopUsers]
    switch (sortBy) {
      case "bandwidth":
        sortedUsers.sort((a, b) => b.total_bytes - a.total_bytes)
        break
      case "time":
        sortedUsers.sort((a, b) => b.total_session_time - a.total_session_time)
        break
      case "sessions":
        sortedUsers.sort((a, b) => b.total_sessions - a.total_sessions)
        break
      case "download":
        sortedUsers.sort((a, b) => b.total_bytes_in - a.total_bytes_in)
        break
      case "upload":
        sortedUsers.sort((a, b) => b.total_bytes_out - a.total_bytes_out)
        break
      default:
        sortedUsers.sort((a, b) => b.total_bytes - a.total_bytes)
    }

    // Apply limit
    const limitedUsers = sortedUsers.slice(0, limit)

    return NextResponse.json(limitedUsers)
  } catch (error) {
    console.error("Error fetching top users:", error)
    return NextResponse.json(
      { error: "Failed to fetch top users" },
      { status: 500 }
    )
  }
}
