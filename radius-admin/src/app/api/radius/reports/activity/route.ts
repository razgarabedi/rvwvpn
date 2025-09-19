import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/reports/activity - Get user activity reports
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const username = searchParams.get('username') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')

    // Default date range (last 30 days)
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 30)

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    switch (type) {
      case 'overview':
        return await getActivityOverview(start, end)
      case 'login-attempts':
        return await getLoginAttempts(start, end, username, limit)
      case 'session-duration':
        return await getSessionDuration(start, end, username, limit)
      case 'usage-patterns':
        return await getUsagePatterns(start, end, username)
      case 'failed-logins':
        return await getFailedLogins(start, end, username, limit)
      case 'active-sessions':
        return await getActiveSessions()
      case 'user-stats':
        return await getUserStats(start, end, username)
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching activity reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity reports" },
      { status: 500 }
    )
  }
}

// Get activity overview with key metrics
async function getActivityOverview(startDate: Date, endDate: Date) {
  // Total sessions in date range
  const totalSessions = await prisma.radAcct.count({
    where: {
      acctstarttime: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  // Active sessions (no stop time)
  const activeSessions = await prisma.radAcct.count({
    where: {
      acctstoptime: null
    }
  })

  // Total unique users
  const uniqueUsers = await prisma.radAcct.findMany({
    where: {
      acctstarttime: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      username: true
    },
    distinct: ['username']
  })

  // Failed login attempts
  const failedLogins = await prisma.radPostAuth.count({
    where: {
      authdate: {
        gte: startDate,
        lte: endDate
      },
      reply: {
        contains: 'Reject'
      }
    }
  })

  // Successful logins
  const successfulLogins = await prisma.radPostAuth.count({
    where: {
      authdate: {
        gte: startDate,
        lte: endDate
      },
      reply: {
        contains: 'Access-Accept'
      }
    }
  })

  // Average session duration
  const avgSessionDuration = await prisma.radAcct.aggregate({
    where: {
      acctstarttime: {
        gte: startDate,
        lte: endDate
      },
      acctstoptime: {
        not: null
      }
    },
    _avg: {
      acctsessiontime: true
    }
  })

  // Data usage (input + output octets)
  const dataUsage = await prisma.radAcct.aggregate({
    where: {
      acctstarttime: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: {
      acctinputoctets: true,
      acctoutputoctets: true
    }
  })

  return NextResponse.json({
    overview: {
      totalSessions,
      activeSessions,
      uniqueUsers: uniqueUsers.length,
      failedLogins,
      successfulLogins,
      avgSessionDuration: avgSessionDuration._avg.acctsessiontime || 0,
      totalDataUsage: Number(dataUsage._sum.acctinputoctets || 0) + Number(dataUsage._sum.acctoutputoctets || 0),
      successRate: successfulLogins + failedLogins > 0 
        ? ((successfulLogins / (successfulLogins + failedLogins)) * 100).toFixed(2)
        : 0
    }
  })
}

// Get login attempts with details
async function getLoginAttempts(startDate: Date, endDate: Date, username?: string, limit: number = 100) {
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

  const loginAttempts = await prisma.radPostAuth.findMany({
    where: whereClause,
    orderBy: {
      authdate: 'desc'
    },
    take: limit,
    select: {
      id: true,
      username: true,
      authdate: true,
      reply: true,
      calledstationid: true,
      callingstationid: true,
      class: true
    }
  })

  return NextResponse.json({
    loginAttempts: loginAttempts.map(attempt => ({
      id: attempt.id.toString(),
      username: attempt.username,
      timestamp: attempt.authdate,
      success: attempt.reply?.includes('Access-Accept') || false,
      reply: attempt.reply,
      calledStationId: attempt.calledstationid,
      callingStationId: attempt.callingstationid,
      class: attempt.class
    }))
  })
}

// Get session duration statistics
async function getSessionDuration(startDate: Date, endDate: Date, username?: string, limit: number = 100) {
  const whereClause: {
    acctstarttime: { gte: Date; lte: Date };
    acctstoptime: { not: null };
    username?: string;
  } = {
    acctstarttime: {
      gte: startDate,
      lte: endDate
    },
    acctstoptime: {
      not: null
    }
  }

  if (username) {
    whereClause.username = username
  }

  const sessions = await prisma.radAcct.findMany({
    where: whereClause,
    orderBy: {
      acctstarttime: 'desc'
    },
    take: limit,
    select: {
      RadAcctId: true,
      username: true,
      acctstarttime: true,
      acctstoptime: true,
      acctsessiontime: true,
      nasipaddress: true,
      calledstationid: true,
      callingstationid: true,
      acctterminatecause: true
    }
  })

  // Calculate statistics
    const sessionTimes = sessions
      .map(s => s.acctsessiontime)
      .filter(time => time !== null)
      .map(time => Number(time))

  const stats = {
    totalSessions: sessions.length,
    avgDuration: sessionTimes.length > 0 
      ? sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length 
      : 0,
    minDuration: sessionTimes.length > 0 ? Math.min(...sessionTimes) : 0,
    maxDuration: sessionTimes.length > 0 ? Math.max(...sessionTimes) : 0,
    totalDuration: sessionTimes.reduce((a, b) => a + b, 0)
  }

  return NextResponse.json({
    stats,
    sessions: sessions.map(session => ({
      id: session.RadAcctId.toString(),
      username: session.username,
      startTime: session.acctstarttime,
      stopTime: session.acctstoptime,
      duration: session.acctsessiontime,
      nasIpAddress: session.nasipaddress,
      calledStationId: session.calledstationid,
      callingStationId: session.callingstationid,
      terminateCause: session.acctterminatecause
    }))
  })
}

// Get usage patterns (hourly/daily patterns)
async function getUsagePatterns(startDate: Date, endDate: Date, username?: string) {
  const whereClause: {
    acctstarttime: { gte: Date; lte: Date };
    username?: string;
  } = {
    acctstarttime: {
      gte: startDate,
      lte: endDate
    }
  }

  if (username) {
    whereClause.username = username
  }

  // Get hourly patterns using safe parameterized query
  const hourlyPatterns = username 
    ? await prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM "acctstarttime") as hour,
          COUNT(*) as session_count,
          AVG("acctsessiontime") as avg_duration
        FROM radacct 
        WHERE "acctstarttime" >= ${startDate} 
          AND "acctstarttime" <= ${endDate}
          AND username = ${username}
        GROUP BY EXTRACT(hour FROM "acctstarttime")
        ORDER BY hour
      `
    : await prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM "acctstarttime") as hour,
          COUNT(*) as session_count,
          AVG("acctsessiontime") as avg_duration
        FROM radacct 
        WHERE "acctstarttime" >= ${startDate} 
          AND "acctstarttime" <= ${endDate}
        GROUP BY EXTRACT(hour FROM "acctstarttime")
        ORDER BY hour
      `

  // Get daily patterns using safe parameterized query
  const dailyPatterns = username
    ? await prisma.$queryRaw`
        SELECT 
          DATE("acctstarttime") as date,
          COUNT(*) as session_count,
          COUNT(DISTINCT username) as unique_users,
          AVG("acctsessiontime") as avg_duration
        FROM radacct 
        WHERE "acctstarttime" >= ${startDate} 
          AND "acctstarttime" <= ${endDate}
          AND username = ${username}
        GROUP BY DATE("acctstarttime")
        ORDER BY date
      `
    : await prisma.$queryRaw`
        SELECT 
          DATE("acctstarttime") as date,
          COUNT(*) as session_count,
          COUNT(DISTINCT username) as unique_users,
          AVG("acctsessiontime") as avg_duration
        FROM radacct 
        WHERE "acctstarttime" >= ${startDate} 
          AND "acctstarttime" <= ${endDate}
        GROUP BY DATE("acctstarttime")
        ORDER BY date
      `

  return NextResponse.json({
    hourlyPatterns,
    dailyPatterns
  })
}

// Get failed login attempts
async function getFailedLogins(startDate: Date, endDate: Date, username?: string, limit: number = 100) {
  const whereClause: {
    authdate: { gte: Date; lte: Date };
    reply: { contains: string };
    username?: string;
  } = {
    authdate: {
      gte: startDate,
      lte: endDate
    },
    reply: {
      contains: 'Reject'
    }
  }

  if (username) {
    whereClause.username = username
  }

  const failedLogins = await prisma.radPostAuth.findMany({
    where: whereClause,
    orderBy: {
      authdate: 'desc'
    },
    take: limit,
    select: {
      id: true,
      username: true,
      authdate: true,
      reply: true,
      calledstationid: true,
      callingstationid: true
    }
  })

  return NextResponse.json({
    failedLogins: failedLogins.map(attempt => ({
      id: attempt.id.toString(),
      username: attempt.username,
      timestamp: attempt.authdate,
      reason: attempt.reply,
      calledStationId: attempt.calledstationid,
      callingStationId: attempt.callingstationid
    }))
  })
}

// Get currently active sessions
async function getActiveSessions() {
  const activeSessions = await prisma.radAcct.findMany({
    where: {
      acctstoptime: null
    },
    orderBy: {
      acctstarttime: 'desc'
    },
    select: {
      RadAcctId: true,
      username: true,
      acctstarttime: true,
      acctupdatetime: true,
      nasipaddress: true,
      calledstationid: true,
      callingstationid: true,
      framedipaddress: true,
      acctinputoctets: true,
      acctoutputoctets: true
    }
  })

  return NextResponse.json({
    activeSessions: activeSessions.map(session => ({
      id: session.RadAcctId.toString(),
      username: session.username,
      startTime: session.acctstarttime,
      lastUpdate: session.acctupdatetime,
      nasIpAddress: session.nasipaddress,
      calledStationId: session.calledstationid,
      callingStationId: session.callingstationid,
      framedIpAddress: session.framedipaddress,
      dataUsage: Number(session.acctinputoctets || 0) + Number(session.acctoutputoctets || 0)
    }))
  })
}

// Get user-specific statistics
async function getUserStats(startDate: Date, endDate: Date, username?: string) {
  if (!username) {
    return NextResponse.json({ error: "Username is required for user stats" }, { status: 400 })
  }

  const userSessions = await prisma.radAcct.findMany({
    where: {
      username: username,
      acctstarttime: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      acctstarttime: 'desc'
    }
  })

  const completedSessions = userSessions.filter(s => s.acctstoptime !== null)
  const activeSessions = userSessions.filter(s => s.acctstoptime === null)

  const totalSessionTime = completedSessions
    .map(s => s.acctsessiontime)
    .filter(time => time !== null)
    .map(time => Number(time))
    .reduce((a, b) => a + b, 0)

  const avgSessionTime = completedSessions.length > 0 
    ? totalSessionTime / completedSessions.length 
    : 0

  const totalDataUsage = userSessions.reduce((total, session) => {
    return total + Number(session.acctinputoctets || 0) + Number(session.acctoutputoctets || 0)
  }, 0)

  return NextResponse.json({
    username,
    totalSessions: userSessions.length,
    completedSessions: completedSessions.length,
    activeSessions: activeSessions.length,
    totalSessionTime,
    avgSessionTime,
    totalDataUsage,
    firstLogin: userSessions.length > 0 ? userSessions[userSessions.length - 1].acctstarttime : null,
    lastLogin: userSessions.length > 0 ? userSessions[0].acctstarttime : null
  })
}
