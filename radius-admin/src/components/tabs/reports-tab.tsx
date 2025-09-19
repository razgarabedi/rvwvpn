"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BarChart3, Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface ActivityOverview {
  totalSessions: number
  activeSessions: number
  uniqueUsers: number
  failedLogins: number
  successfulLogins: number
  avgSessionDuration: number
  totalDataUsage: number
  successRate: string
}

interface LoginAttempt {
  id: string
  username: string
  timestamp: Date
  success: boolean
  reply: string
  calledStationId: string
  callingStationId: string
  class: string
}

interface SessionData {
  id: string
  username: string
  startTime: Date
  stopTime: Date | null
  duration: number | null
  nasIpAddress: string
  calledStationId: string
  callingStationId: string
  terminateCause: string | null
}

export default function ReportsTab() {
  const [activeReport, setActiveReport] = useState<string>("overview")
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [username, setUsername] = useState("")
  const [overview, setOverview] = useState<ActivityOverview | null>(null)
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(false)

  const reportTypes = [
    { id: "overview", label: "Activity Overview", icon: BarChart3 },
    { id: "login-attempts", label: "Login Attempts", icon: Activity },
    { id: "session-duration", label: "Session Duration", icon: Clock },
    { id: "usage-patterns", label: "Usage Patterns", icon: TrendingUp },
    { id: "failed-logins", label: "Failed Logins", icon: AlertTriangle },
    { id: "active-sessions", label: "Active Sessions", icon: Users }
  ]

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: activeReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(username && { username })
      })

      const response = await fetch(`/api/radius/reports/activity?${params}`)
      const data = await response.json()

      if (activeReport === "overview") {
        setOverview(data.overview)
      } else if (activeReport === "login-attempts") {
        setLoginAttempts(data.loginAttempts || [])
      } else if (activeReport === "session-duration") {
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }, [activeReport, dateRange.startDate, dateRange.endDate, username])

  useEffect(() => {
    if (activeReport) {
      fetchReportData()
    }
  }, [activeReport, fetchReportData])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const renderOverview = () => {
    if (!overview) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalSessions}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-green-600">{overview.activeSessions}</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">{overview.successRate}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Usage</p>
              <p className="text-2xl font-bold text-purple-600">{formatBytes(overview.totalDataUsage)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-indigo-600">{overview.uniqueUsers}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins</p>
              <p className="text-2xl font-bold text-red-600">{overview.failedLogins}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Session Duration</p>
              <p className="text-2xl font-bold text-orange-600">{formatDuration(overview.avgSessionDuration)}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successful Logins</p>
              <p className="text-2xl font-bold text-green-600">{overview.successfulLogins}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>
    )
  }

  const renderLoginAttempts = () => {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Login Attempts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calling Station</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Called Station</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loginAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {attempt.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(attempt.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      attempt.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attempt.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attempt.callingStationId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attempt.calledStationId || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  const renderSessionDuration = () => {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Session Duration Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAS IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {session.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.duration ? formatDuration(session.duration) : 'Active'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.stopTime 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {session.stopTime ? 'Completed' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.nasIpAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">User Activity Reports</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Track user login attempts, session duration, and usage patterns with comprehensive FreeRADIUS analytics.
        </p>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username (Optional)</label>
            <Input
              placeholder="Filter by username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchReportData} disabled={loading} className="w-full">
              {loading ? "Loading..." : "Refresh Data"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Type Selector */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Report Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  activeReport === report.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{report.label}</p>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Report Content */}
      {loading && (
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading report data...</p>
          </div>
        </Card>
      )}

      {!loading && activeReport === "overview" && renderOverview()}
      {!loading && activeReport === "login-attempts" && renderLoginAttempts()}
      {!loading && activeReport === "session-duration" && renderSessionDuration()}
      {!loading && activeReport === "usage-patterns" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Usage Patterns</h3>
          <p className="text-gray-600">Usage pattern analysis coming soon...</p>
        </Card>
      )}
      {!loading && activeReport === "failed-logins" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Failed Login Attempts</h3>
          <p className="text-gray-600">Failed login analysis coming soon...</p>
        </Card>
      )}
      {!loading && activeReport === "active-sessions" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Currently Active Sessions</h3>
          <p className="text-gray-600">Active sessions monitoring coming soon...</p>
        </Card>
      )}
    </div>
  )
}
