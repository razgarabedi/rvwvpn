import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/reports/auth-logs - Get authentication logs
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const username = searchParams.get('username')
    const status = searchParams.get('status') // 'success', 'failed', 'all'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Default date range (last 7 days)
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 7)

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    const whereClause: {
      authdate: { gte: Date; lte: Date };
      username?: string;
      reply?: { contains: string };
    } = {
      authdate: {
        gte: start,
        lte: end
      }
    }

    if (username) {
      whereClause.username = username
    }

    if (status === 'success') {
      whereClause.reply = {
        contains: 'Access-Accept'
      }
    } else if (status === 'failed') {
      whereClause.reply = {
        contains: 'Reject'
      }
    }

    const [authLogs, totalCount] = await Promise.all([
      prisma.radPostAuth.findMany({
        where: whereClause,
        orderBy: {
          authdate: 'desc'
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          username: true,
          authdate: true,
          reply: true,
          calledstationid: true,
          callingstationid: true,
          class: true
        }
      }),
      prisma.radPostAuth.count({
        where: whereClause
      })
    ])

    // Get summary statistics
    const summary = await getAuthSummary(start, end, username || undefined)

    return NextResponse.json({
      logs: authLogs.map(log => ({
        id: log.id.toString(),
        username: log.username,
        timestamp: log.authdate,
        success: log.reply?.includes('Access-Accept') || false,
        reply: log.reply,
        calledStationId: log.calledstationid,
        callingStationId: log.callingstationid,
        class: log.class
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary
    })
  } catch (error) {
    console.error("Error fetching auth logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch auth logs" },
      { status: 500 }
    )
  }
}

// Get authentication summary statistics
async function getAuthSummary(startDate: Date, endDate: Date, username?: string) {
  const whereClause: {
    authdate: { gte: Date; lte: Date };
    username?: string;
  } = {
    authdate: {
      gte: startDate,
      lte: endDate
    }
  }

  if (username) {
    whereClause.username = username
  }

  const [totalAttempts, successfulAttempts, failedAttempts] = await Promise.all([
    prisma.radPostAuth.count({ where: whereClause }),
    prisma.radPostAuth.count({
      where: {
        ...whereClause,
        reply: {
          contains: 'Access-Accept'
        }
      }
    }),
    prisma.radPostAuth.count({
      where: {
        ...whereClause,
        reply: {
          contains: 'Reject'
        }
      }
    })
  ])

  const successRate = totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(2) : 0

  // Get top failed usernames
  const topFailedUsers = await prisma.radPostAuth.groupBy({
    by: ['username'],
    where: {
      ...whereClause,
      reply: {
        contains: 'Reject'
      }
    },
    _count: {
      username: true
    },
    orderBy: {
      _count: {
        username: 'desc'
      }
    },
    take: 10
  })

  // Get hourly distribution
  const hourlyDistribution = username
    ? await prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM "authdate") as hour,
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN "reply" LIKE '%Access-Accept%' THEN 1 END) as successful,
          COUNT(CASE WHEN "reply" LIKE '%Reject%' THEN 1 END) as failed
        FROM radpostauth 
        WHERE "authdate" >= ${startDate} 
          AND "authdate" <= ${endDate}
          AND username = ${username}
        GROUP BY EXTRACT(hour FROM "authdate")
        ORDER BY hour
      `
    : await prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM "authdate") as hour,
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN "reply" LIKE '%Access-Accept%' THEN 1 END) as successful,
          COUNT(CASE WHEN "reply" LIKE '%Reject%' THEN 1 END) as failed
        FROM radpostauth 
        WHERE "authdate" >= ${startDate} 
          AND "authdate" <= ${endDate}
        GROUP BY EXTRACT(hour FROM "authdate")
        ORDER BY hour
      `

  return {
    totalAttempts,
    successfulAttempts,
    failedAttempts,
    successRate: parseFloat(successRate.toString()),
    topFailedUsers: topFailedUsers.map(user => ({
      username: user.username,
      failedCount: user._count.username
    })),
    hourlyDistribution
  }
}
