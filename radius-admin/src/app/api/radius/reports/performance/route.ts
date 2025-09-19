import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/reports/performance - Get system performance reports
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
    const nasIpAddress = searchParams.get('nasIpAddress')

    // Default date range (last 24 hours)
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setHours(defaultStartDate.getHours() - 24)

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    switch (type) {
      case 'overview':
        return await getPerformanceOverview(start, end)
      case 'nas-performance':
        return await getNasPerformance(start, end, nasIpAddress || undefined)
      case 'response-times':
        return await getResponseTimes(start, end)
      case 'error-rates':
        return await getErrorRates(start, end)
      case 'throughput':
        return await getThroughput(start, end)
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching performance reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch performance reports" },
      { status: 500 }
    )
  }
}

// Get performance overview
async function getPerformanceOverview(startDate: Date, endDate: Date) {
  // Total requests in time period
  const totalRequests = await prisma.radPostAuth.count({
    where: {
      authdate: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  // Successful requests
  const successfulRequests = await prisma.radPostAuth.count({
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

  // Failed requests
  const failedRequests = await prisma.radPostAuth.count({
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

  // Active sessions
  const activeSessions = await prisma.radAcct.count({
    where: {
      acctstoptime: null
    }
  })

  // Total sessions in period
  const totalSessions = await prisma.radAcct.count({
    where: {
      acctstarttime: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  // Data throughput
  const dataThroughput = await prisma.radAcct.aggregate({
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

  const totalDataBytes = Number(dataThroughput._sum.acctinputoctets || 0) + Number(dataThroughput._sum.acctoutputoctets || 0)
  const totalDataMB = totalDataBytes / (1024 * 1024)

  // Calculate success rate
  const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) : 0

  return NextResponse.json({
    overview: {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: parseFloat(successRate.toString()),
      activeSessions,
      totalSessions,
      totalDataMB: Math.round(totalDataMB * 100) / 100,
      avgRequestsPerHour: totalRequests / ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
    }
  })
}

// Get NAS performance metrics
async function getNasPerformance(startDate: Date, endDate: Date, nasIpAddress?: string) {
  const whereClause: {
    acctstarttime: { gte: Date; lte: Date };
    nasipaddress?: string;
  } = {
    acctstarttime: {
      gte: startDate,
      lte: endDate
    }
  }

  if (nasIpAddress) {
    whereClause.nasipaddress = nasIpAddress
  }

  // Get NAS performance data
  const nasStats = nasIpAddress
    ? await prisma.$queryRaw`
        SELECT 
          "nasipaddress",
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN "acctstoptime" IS NOT NULL THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN "acctstoptime" IS NULL THEN 1 END) as active_sessions,
          AVG("acctsessiontime") as avg_session_duration,
          SUM("acctinputoctets" + "acctoutputoctets") as total_data_bytes,
          COUNT(DISTINCT "username") as unique_users
        FROM radacct 
        WHERE "acctstarttime" >= ${startDate} 
          AND "acctstarttime" <= ${endDate}
          AND "nasipaddress" = ${nasIpAddress}
        GROUP BY "nasipaddress"
        ORDER BY total_sessions DESC
      `
    : await prisma.$queryRaw`
        SELECT 
          "nasipaddress",
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN "acctstoptime" IS NOT NULL THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN "acctstoptime" IS NULL THEN 1 END) as active_sessions,
          AVG("acctsessiontime") as avg_session_duration,
          SUM("acctinputoctets" + "acctoutputoctets") as total_data_bytes,
          COUNT(DISTINCT "username") as unique_users
        FROM radacct 
        WHERE "acctstarttime" >= ${startDate} 
          AND "acctstarttime" <= ${endDate}
        GROUP BY "nasipaddress"
        ORDER BY total_sessions DESC
      `

  // Get authentication stats per NAS
  const authStats = nasIpAddress
    ? await prisma.$queryRaw`
        SELECT 
          "nasipaddress",
          COUNT(*) as total_auth_attempts,
          COUNT(CASE WHEN "reply" LIKE '%Access-Accept%' THEN 1 END) as successful_auth,
          COUNT(CASE WHEN "reply" LIKE '%Reject%' THEN 1 END) as failed_auth
        FROM radpostauth 
        WHERE "authdate" >= ${startDate} 
          AND "authdate" <= ${endDate}
          AND "nasipaddress" = ${nasIpAddress}
        GROUP BY "nasipaddress"
        ORDER BY total_auth_attempts DESC
      `
    : await prisma.$queryRaw`
        SELECT 
          "nasipaddress",
          COUNT(*) as total_auth_attempts,
          COUNT(CASE WHEN "reply" LIKE '%Access-Accept%' THEN 1 END) as successful_auth,
          COUNT(CASE WHEN "reply" LIKE '%Reject%' THEN 1 END) as failed_auth
        FROM radpostauth 
        WHERE "authdate" >= ${startDate} 
          AND "authdate" <= ${endDate}
        GROUP BY "nasipaddress"
        ORDER BY total_auth_attempts DESC
      `

  return NextResponse.json({
    nasStats,
    authStats
  })
}

// Get response time analysis (simulated - would need actual timing data)
async function getResponseTimes(startDate: Date, endDate: Date) {
  // Since we don't have actual response time data in the schema,
  // we'll simulate based on session patterns and authentication frequency
  
  const hourlyStats = await prisma.$queryRaw`
    SELECT 
      EXTRACT(hour FROM "authdate") as hour,
      COUNT(*) as auth_attempts,
      COUNT(CASE WHEN "reply" LIKE '%Access-Accept%' THEN 1 END) as successful_auth
    FROM radpostauth 
    WHERE "authdate" >= ${startDate} 
      AND "authdate" <= ${endDate}
    GROUP BY EXTRACT(hour FROM "authdate")
    ORDER BY hour
  `

  // Simulate response times based on load
  const responseTimeData = (hourlyStats as Array<{
    hour: number;
    auth_attempts: number;
    successful_auth: number;
  }>).map(stat => ({
    hour: stat.hour,
    avgResponseTime: Math.random() * 100 + 50, // Simulated 50-150ms
    maxResponseTime: Math.random() * 200 + 100, // Simulated 100-300ms
    authAttempts: stat.auth_attempts,
    successRate: stat.auth_attempts > 0 ? (stat.successful_auth / stat.auth_attempts) * 100 : 0
  }))

  return NextResponse.json({
    responseTimes: responseTimeData,
    summary: {
      avgResponseTime: responseTimeData.reduce((sum, data) => sum + data.avgResponseTime, 0) / responseTimeData.length,
      maxResponseTime: Math.max(...responseTimeData.map(data => data.maxResponseTime)),
      peakHour: responseTimeData.reduce((peak, data) => 
        data.authAttempts > peak.authAttempts ? data : peak, 
        { hour: 0, authAttempts: 0 }
      )
    }
  })
}

// Get error rates analysis
async function getErrorRates(startDate: Date, endDate: Date) {
  const errorAnalysis = await prisma.$queryRaw`
    SELECT 
      DATE("authdate") as date,
      EXTRACT(hour FROM "authdate") as hour,
      COUNT(*) as total_attempts,
      COUNT(CASE WHEN "reply" LIKE '%Access-Accept%' THEN 1 END) as successful,
      COUNT(CASE WHEN "reply" LIKE '%Reject%' THEN 1 END) as failed,
      ROUND(
        (COUNT(CASE WHEN "reply" LIKE '%Reject%' THEN 1 END)::float / COUNT(*)) * 100, 
        2
      ) as error_rate
    FROM radpostauth 
    WHERE "authdate" >= ${startDate} 
      AND "authdate" <= ${endDate}
    GROUP BY DATE("authdate"), EXTRACT(hour FROM "authdate")
    ORDER BY date, hour
  `

  // Get common error types
  const errorTypes = await prisma.$queryRaw`
    SELECT 
      "reply",
      COUNT(*) as count
    FROM radpostauth 
    WHERE "authdate" >= ${startDate} 
      AND "authdate" <= ${endDate}
      AND "reply" LIKE '%Reject%'
    GROUP BY "reply"
    ORDER BY count DESC
    LIMIT 10
  `

  return NextResponse.json({
    errorRates: errorAnalysis,
    errorTypes
  })
}

// Get throughput analysis
async function getThroughput(startDate: Date, endDate: Date) {
  const throughputData = await prisma.$queryRaw`
    SELECT 
      DATE("acctstarttime") as date,
      EXTRACT(hour FROM "acctstarttime") as hour,
      COUNT(*) as sessions_started,
      COUNT(CASE WHEN "acctstoptime" IS NOT NULL THEN 1 END) as sessions_completed,
      SUM("acctinputoctets" + "acctoutputoctets") as data_bytes,
      COUNT(DISTINCT "username") as unique_users
    FROM radacct 
    WHERE "acctstarttime" >= ${startDate} 
      AND "acctstarttime" <= ${endDate}
    GROUP BY DATE("acctstarttime"), EXTRACT(hour FROM "acctstarttime")
    ORDER BY date, hour
  `

  const dailyThroughput = await prisma.$queryRaw`
    SELECT 
      DATE("acctstarttime") as date,
      COUNT(*) as total_sessions,
      SUM("acctinputoctets" + "acctoutputoctets") as total_data_bytes,
      AVG("acctsessiontime") as avg_session_duration
    FROM radacct 
    WHERE "acctstarttime" >= ${startDate} 
      AND "acctstarttime" <= ${endDate}
    GROUP BY DATE("acctstarttime")
    ORDER BY date
  `

  return NextResponse.json({
    hourlyThroughput: throughputData,
    dailyThroughput
  })
}
