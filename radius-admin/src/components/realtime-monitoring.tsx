"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Wifi, 
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Zap
} from "lucide-react"
import { realtimeService } from "@/lib/realtime-service"

interface RealtimeData {
  timestamp: string
  overview: {
    activeSessions: number
    sessionsStarted: number
    uniqueUsers: number
    successfulAuth: number
    failedAuth: number
    successRate: number
    totalDataUsage: number
    dataUsageMB: number
  }
  recentActivity: Array<{
    id: string
    username: string
    timestamp: string
    success: boolean
    reply: string
    calledStationId: string
    callingStationId: string
  }>
}

interface SystemMetrics {
  timestamp: string
  system: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    loadAverage: number
    networkConnections: number
    uptime: string
  }
  freeradius: {
    active: boolean
    processes: number
    memoryUsageKB: number
    memoryUsageMB: number
  }
}

interface ActiveSession {
  id: string
  username: string
  startTime: string
  lastUpdate: string
  nasIpAddress: string
  calledStationId: string
  callingStationId: string
  framedIpAddress: string
  dataUsage: number
  dataUsageMB: number
  duration: number
}

export default function RealtimeMonitoring() {
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchRealtimeData = useCallback(async () => {
    try {
      const [overviewRes, systemRes, sessionsRes] = await Promise.all([
        fetch('/api/radius/reports/realtime?type=overview'),
        fetch('/api/radius/reports/realtime?type=system'),
        fetch('/api/radius/reports/realtime?type=sessions')
      ])

      const [overview, system, sessions] = await Promise.all([
        overviewRes.json(),
        systemRes.json(),
        sessionsRes.json()
      ])

      setRealtimeData(overview)
      setSystemMetrics(system)
      setActiveSessions(sessions.activeSessions || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching real-time data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial data fetch
    fetchRealtimeData()
    
    // Set up real-time connection
    realtimeService.connect()
    
    // Listen for real-time updates
    const handleRealtimeData = (data: unknown) => {
      if (data && typeof data === 'object' && 'type' in data && 'data' in data) {
        const eventData = data as { type: string; data: RealtimeData }
        if (eventData.type === 'update' && eventData.data) {
          setRealtimeData(eventData.data)
          setLastUpdate(new Date())
        }
      }
    }
    
    const handleConnectionStatus = (status: unknown) => {
      console.log('Real-time connection status:', status)
    }
    
    realtimeService.on('data', handleRealtimeData)
    realtimeService.on('connected', handleConnectionStatus)
    realtimeService.on('disconnected', handleConnectionStatus)
    realtimeService.on('error', handleConnectionStatus)
    
    // Fallback polling if WebSocket is not available
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchRealtimeData, 10000) // Update every 10 seconds as fallback
    }
    
    return () => {
      realtimeService.off('data', handleRealtimeData)
      realtimeService.off('connected', handleConnectionStatus)
      realtimeService.off('disconnected', handleConnectionStatus)
      realtimeService.off('error', handleConnectionStatus)
      
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [fetchRealtimeData, autoRefresh])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  // const getStatusBgColor = (value: number, thresholds: { good: number; warning: number }) => {
  //   if (value <= thresholds.good) return 'bg-green-50 border-green-200'
  //   if (value <= thresholds.warning) return 'bg-yellow-50 border-yellow-200'
  //   return 'bg-red-50 border-red-200'
  // }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading real-time data...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Real-time Monitoring</h2>
              <p className="text-gray-600">Live system activity and FreeRADIUS connections</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </span>
            </div>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              size="sm"
            >
              {autoRefresh ? 'Pause' : 'Resume'}
            </Button>
            <Button
              onClick={fetchRealtimeData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold text-blue-600">
                {realtimeData?.overview?.activeSessions ?? 0}
              </p>
              <p className="text-sm text-gray-500">Currently connected</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {realtimeData?.overview?.successRate ?? 0}%
              </p>
              <p className="text-sm text-gray-500">Last hour</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Usage</p>
              <p className="text-3xl font-bold text-purple-600">
                {realtimeData?.overview?.dataUsageMB ?? 0} MB
              </p>
              <p className="text-sm text-gray-500">Active sessions</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-3xl font-bold text-indigo-600">
                {realtimeData?.overview?.uniqueUsers ?? 0}
              </p>
              <p className="text-sm text-gray-500">Last hour</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Wifi className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Resources</h3>
              <Server className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">CPU Usage</span>
                </div>
                <span className={`font-semibold ${getStatusColor(systemMetrics?.system?.cpuUsage ?? 0, { good: 50, warning: 80 })}`}>
                  {systemMetrics?.system?.cpuUsage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (systemMetrics?.system?.cpuUsage ?? 0) <= 50 ? 'bg-green-500' : 
                    (systemMetrics?.system?.cpuUsage ?? 0) <= 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(systemMetrics?.system?.cpuUsage ?? 0, 100)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Memory Usage</span>
                </div>
                <span className={`font-semibold ${getStatusColor(systemMetrics?.system?.memoryUsage ?? 0, { good: 70, warning: 90 })}`}>
                  {systemMetrics?.system?.memoryUsage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (systemMetrics?.system?.memoryUsage ?? 0) <= 70 ? 'bg-green-500' : 
                    (systemMetrics?.system?.memoryUsage ?? 0) <= 90 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(systemMetrics?.system?.memoryUsage ?? 0, 100)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Disk Usage</span>
                </div>
                <span className={`font-semibold ${getStatusColor(systemMetrics?.system?.diskUsage ?? 0, { good: 80, warning: 95 })}`}>
                  {systemMetrics?.system?.diskUsage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (systemMetrics?.system?.diskUsage ?? 0) <= 80 ? 'bg-green-500' : 
                    (systemMetrics?.system?.diskUsage ?? 0) <= 95 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(systemMetrics?.system?.diskUsage ?? 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">FreeRADIUS Status</h3>
              <div className={`p-2 rounded-lg ${systemMetrics?.freeradius?.active ? 'bg-green-50' : 'bg-red-50'}`}>
                {systemMetrics?.freeradius?.active ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`font-semibold ${systemMetrics?.freeradius?.active ? 'text-green-600' : 'text-red-600'}`}>
                  {systemMetrics?.freeradius?.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Processes</span>
                <span className="font-semibold text-gray-900">{systemMetrics?.freeradius?.processes ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <span className="font-semibold text-gray-900">{systemMetrics?.freeradius?.memoryUsageMB ?? 0} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="font-semibold text-gray-900">{systemMetrics?.system?.uptime ?? 'Unknown'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Network</h3>
              <Wifi className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connections</span>
                <span className="font-semibold text-gray-900">{systemMetrics?.system?.networkConnections ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Load Average</span>
                <span className={`font-semibold ${getStatusColor(systemMetrics?.system?.loadAverage ?? 0, { good: 2, warning: 5 })}`}>
                  {systemMetrics?.system?.loadAverage ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Sessions</span>
                <span className="font-semibold text-gray-900">{realtimeData?.overview?.activeSessions ?? 0}</span>
              </div>
            </div>
          </Card>
        </div>

      {/* Active Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">{activeSessions.length} active</span>
          </div>
        </div>
        
        {activeSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAS IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">{session.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(session.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatBytes(session.dataUsage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.nasIpAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active sessions</p>
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      {realtimeData?.recentActivity && realtimeData.recentActivity.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Zap className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {realtimeData.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium text-gray-900">{activity.username}</span>
                  <span className="text-gray-600">
                    {activity.success ? 'Login successful' : 'Login failed'}
                  </span>
                  {activity.callingStationId && (
                    <span className="text-sm text-gray-500">from {activity.callingStationId}</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
