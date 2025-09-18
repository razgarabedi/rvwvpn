"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Server, Database, Activity, CheckCircle, XCircle, AlertTriangle, Clock, Users, Wifi } from "lucide-react"

interface RADIUSStatus {
  freeradius: {
    status: "running" | "stopped" | "error"
    version: string
    pid: number
    uptime: number
    port: number
    last_restart: string
    error_message?: string
  }
  database: {
    status: "connected" | "disconnected" | "error"
    type: string
    version: string
    host: string
    port: number
    database: string
    uptime: number
    last_connection: string
    error_message?: string
  }
  services: Array<{
    name: string
    status: "running" | "stopped" | "error"
    pid: number
    uptime: number
    last_restart: string
    error_message?: string
  }>
  statistics: {
    total_requests: number
    successful_requests: number
    failed_requests: number
    active_sessions: number
    total_users: number
    last_request: string
  }
  last_updated: string
}

export default function RADIUSStatusReport() {
  const [radiusStatus, setRadiusStatus] = useState<RADIUSStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch RADIUS status
  const fetchRadiusStatus = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/radius/reports/radius-status")
      if (response.ok) {
        const data = await response.json()
        setRadiusStatus(data)
      } else {
        console.error("Failed to fetch RADIUS status")
      }
    } catch (error) {
      console.error("Error fetching RADIUS status:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRadiusStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRadiusStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
      case "connected":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Running</Badge>
      case "stopped":
      case "disconnected":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />Stopped</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "stopped":
      case "disconnected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading RADIUS status...</p>
        </div>
      </div>
    )
  }

  if (!radiusStatus) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">RADIUS Status Unavailable</h3>
        <p className="text-gray-600">Unable to retrieve RADIUS status information.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                RADIUS Status
              </CardTitle>
              <CardDescription>
                FreeRADIUS server and database status monitoring
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRadiusStatus}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FreeRADIUS Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(radiusStatus.freeradius.status)}
                <h3 className="text-lg font-medium text-gray-900">FreeRADIUS Server</h3>
                {getStatusBadge(radiusStatus.freeradius.status)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="text-sm font-mono">{radiusStatus.freeradius.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">PID:</span>
                  <span className="text-sm font-mono">{radiusStatus.freeradius.pid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Port:</span>
                  <span className="text-sm font-mono">{radiusStatus.freeradius.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime:</span>
                  <span className="text-sm">{formatUptime(radiusStatus.freeradius.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Restart:</span>
                  <span className="text-sm">{new Date(radiusStatus.freeradius.last_restart).toLocaleString()}</span>
                </div>
                {radiusStatus.freeradius.error_message && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Error: {radiusStatus.freeradius.error_message}
                  </div>
                )}
              </div>
            </div>

            {/* Database Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(radiusStatus.database.status)}
                <h3 className="text-lg font-medium text-gray-900">Database</h3>
                {getStatusBadge(radiusStatus.database.status)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-mono">{radiusStatus.database.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="text-sm font-mono">{radiusStatus.database.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Host:</span>
                  <span className="text-sm font-mono">{radiusStatus.database.host}:{radiusStatus.database.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Database:</span>
                  <span className="text-sm font-mono">{radiusStatus.database.database}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime:</span>
                  <span className="text-sm">{formatUptime(radiusStatus.database.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Connection:</span>
                  <span className="text-sm">{new Date(radiusStatus.database.last_connection).toLocaleString()}</span>
                </div>
                {radiusStatus.database.error_message && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Error: {radiusStatus.database.error_message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{radiusStatus.statistics.total_requests}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{radiusStatus.statistics.successful_requests}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{radiusStatus.statistics.failed_requests}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{radiusStatus.statistics.active_sessions}</div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{radiusStatus.statistics.total_users}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600">
                {radiusStatus.statistics.total_requests > 0 
                  ? Math.round((radiusStatus.statistics.successful_requests / radiusStatus.statistics.total_requests) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Related Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {radiusStatus.services.map((service, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <span className="font-medium">{service.name}</span>
                    {getStatusBadge(service.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    PID: {service.pid}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Uptime:</span> {formatUptime(service.uptime)}
                  </div>
                  <div>
                    <span className="font-medium">Last Restart:</span> {new Date(service.last_restart).toLocaleString()}
                  </div>
                </div>
                {service.error_message && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                    Error: {service.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(radiusStatus.last_updated).toLocaleString()}
      </div>
    </div>
  )
}
