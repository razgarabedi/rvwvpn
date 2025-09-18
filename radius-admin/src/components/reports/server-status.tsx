"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Server, Cpu, HardDrive, MemoryStick, Clock, Activity, Thermometer, Wifi } from "lucide-react"

interface ServerStatus {
  hostname: string
  os: string
  kernel: string
  uptime: number
  cpu: {
    usage: number
    cores: number
    model: string
    temperature: number
  }
  memory: {
    total: number
    used: number
    free: number
    cached: number
    swap_total: number
    swap_used: number
  }
  disk: {
    total: number
    used: number
    free: number
    usage_percent: number
  }
  network: {
    interfaces: Array<{
      name: string
      status: "up" | "down"
      rx_bytes: number
      tx_bytes: number
      ip_address: string
    }>
  }
  load_average: {
    one_minute: number
    five_minutes: number
    fifteen_minutes: number
  }
  processes: {
    total: number
    running: number
    sleeping: number
    zombie: number
  }
  last_updated: string
}

export default function ServerStatusReport() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch server status
  const fetchServerStatus = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/radius/reports/server-status")
      if (response.ok) {
        const data = await response.json()
        setServerStatus(data)
      } else {
        console.error("Failed to fetch server status")
      }
    } catch (error) {
      console.error("Error fetching server status:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchServerStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchServerStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

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

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "up":
        return "bg-green-100 text-green-800"
      case "down":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get usage color
  const getUsageColor = (usage: number) => {
    if (usage >= 90) return "text-red-600"
    if (usage >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading server status...</p>
        </div>
      </div>
    )
  }

  if (!serverStatus) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Server Status Unavailable</h3>
        <p className="text-gray-600">Unable to retrieve server status information.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Server Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Server Status
              </CardTitle>
              <CardDescription>
                Real-time server monitoring and system information
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatUptime(serverStatus.uptime)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchServerStatus}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">System Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Hostname:</span>
                  <span className="text-sm font-mono">{serverStatus.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">OS:</span>
                  <span className="text-sm">{serverStatus.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Kernel:</span>
                  <span className="text-sm font-mono">{serverStatus.kernel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime:</span>
                  <span className="text-sm">{formatUptime(serverStatus.uptime)}</span>
                </div>
              </div>
            </div>

            {/* CPU Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">CPU Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Model:</span>
                  <span className="text-sm font-mono">{serverStatus.cpu.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cores:</span>
                  <span className="text-sm">{serverStatus.cpu.cores}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Usage:</span>
                  <span className={`text-sm font-medium ${getUsageColor(serverStatus.cpu.usage)}`}>
                    {serverStatus.cpu.usage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Temperature:</span>
                  <span className="text-sm flex items-center gap-1">
                    <Thermometer className="h-3 w-3" />
                    {serverStatus.cpu.temperature}°C
                  </span>
                </div>
              </div>
            </div>

            {/* Load Average */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Load Average</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">1 minute:</span>
                  <span className="text-sm font-mono">{serverStatus.load_average.one_minute.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">5 minutes:</span>
                  <span className="text-sm font-mono">{serverStatus.load_average.five_minutes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">15 minutes:</span>
                  <span className="text-sm font-mono">{serverStatus.load_average.fifteen_minutes.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CPU Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            CPU Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CPU Usage</span>
              <span className={`text-sm font-medium ${getUsageColor(serverStatus.cpu.usage)}`}>
                {serverStatus.cpu.usage.toFixed(1)}%
              </span>
            </div>
            <Progress value={serverStatus.cpu.usage} className="h-2" />
            <div className="text-xs text-gray-500">
              {serverStatus.cpu.cores} cores • {serverStatus.cpu.model}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MemoryStick className="h-5 w-5" />
            Memory Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">RAM</span>
                  <span className="text-sm text-gray-600">
                    {formatBytes(serverStatus.memory.used)} / {formatBytes(serverStatus.memory.total)}
                  </span>
                </div>
                <Progress 
                  value={(serverStatus.memory.used / serverStatus.memory.total) * 100} 
                  className="h-2" 
                />
                <div className="text-xs text-gray-500">
                  Free: {formatBytes(serverStatus.memory.free)} • Cached: {formatBytes(serverStatus.memory.cached)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Swap</span>
                  <span className="text-sm text-gray-600">
                    {formatBytes(serverStatus.memory.swap_used)} / {formatBytes(serverStatus.memory.swap_total)}
                  </span>
                </div>
                <Progress 
                  value={serverStatus.memory.swap_total > 0 ? (serverStatus.memory.swap_used / serverStatus.memory.swap_total) * 100 : 0} 
                  className="h-2" 
                />
                <div className="text-xs text-gray-500">
                  {serverStatus.memory.swap_total > 0 ? 'Swap usage' : 'No swap configured'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disk Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Disk Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Root Partition</span>
              <span className="text-sm text-gray-600">
                {formatBytes(serverStatus.disk.used)} / {formatBytes(serverStatus.disk.total)}
              </span>
            </div>
            <Progress value={serverStatus.disk.usage_percent} className="h-2" />
            <div className="text-xs text-gray-500">
              Free: {formatBytes(serverStatus.disk.free)} • Used: {serverStatus.disk.usage_percent.toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Interfaces */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Network Interfaces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serverStatus.network.interfaces.map((iface, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{iface.name}</span>
                    <Badge className={getStatusBadgeColor(iface.status)}>
                      {iface.status}
                    </Badge>
                  </div>
                  <span className="text-sm font-mono">{iface.ip_address}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">RX:</span> {formatBytes(iface.rx_bytes)}
                  </div>
                  <div>
                    <span className="font-medium">TX:</span> {formatBytes(iface.tx_bytes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Process Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{serverStatus.processes.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{serverStatus.processes.running}</div>
              <div className="text-sm text-gray-600">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{serverStatus.processes.sleeping}</div>
              <div className="text-sm text-gray-600">Sleeping</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{serverStatus.processes.zombie}</div>
              <div className="text-sm text-gray-600">Zombie</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(serverStatus.last_updated).toLocaleString()}
      </div>
    </div>
  )
}
