"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Server, 
  Download, 
  Upload, 
  LogIn, 
  RefreshCw, 
  BarChart3,
  Activity,
  Calendar,
  Users
} from "lucide-react"

interface ServerStats {
  totalLogins: number
  totalUsers: number
  totalDownload: number
  totalUpload: number
  avgSessionTime: string
  peakConcurrentUsers: number
  uptime: string
  lastRestart: string
}

interface TrafficData {
  date: string
  download: number
  upload: number
  logins: number
  users: number
}

interface LoginData {
  hour: string
  count: number
}

interface TopUser {
  username: string
  logins: number
  download: number
  upload: number
  group: string
}

export default function ServerWideGraphs() {
  const [serverStats, setServerStats] = useState<ServerStats | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [loginData, setLoginData] = useState<LoginData[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [timeRange, setTimeRange] = useState("7d")
  const [activeGraph, setActiveGraph] = useState<"logins" | "traffic">("logins")
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  const mockServerStats: ServerStats = {
    totalLogins: 15420,
    totalUsers: 1247,
    totalDownload: 124.7,
    totalUpload: 89.3,
    avgSessionTime: "2h 45m",
    peakConcurrentUsers: 156,
    uptime: "15 days, 8 hours",
    lastRestart: "2024-01-01 00:00:00"
  }

  const mockTrafficData: TrafficData[] = [
    { date: "2024-01-08", download: 12.4, upload: 8.9, logins: 234, users: 45 },
    { date: "2024-01-09", download: 15.7, upload: 11.2, logins: 287, users: 52 },
    { date: "2024-01-10", download: 18.3, upload: 13.6, logins: 312, users: 61 },
    { date: "2024-01-11", download: 14.9, upload: 10.8, logins: 298, users: 58 },
    { date: "2024-01-12", download: 22.1, upload: 16.4, logins: 356, users: 67 },
    { date: "2024-01-13", download: 19.8, upload: 14.7, logins: 334, users: 63 },
    { date: "2024-01-14", download: 16.5, upload: 12.1, logins: 289, users: 55 }
  ]

  const mockLoginData: LoginData[] = [
    { hour: "00:00", count: 12 },
    { hour: "01:00", count: 8 },
    { hour: "02:00", count: 5 },
    { hour: "03:00", count: 3 },
    { hour: "04:00", count: 7 },
    { hour: "05:00", count: 15 },
    { hour: "06:00", count: 28 },
    { hour: "07:00", count: 45 },
    { hour: "08:00", count: 67 },
    { hour: "09:00", count: 89 },
    { hour: "10:00", count: 95 },
    { hour: "11:00", count: 87 },
    { hour: "12:00", count: 78 },
    { hour: "13:00", count: 92 },
    { hour: "14:00", count: 105 },
    { hour: "15:00", count: 98 },
    { hour: "16:00", count: 112 },
    { hour: "17:00", count: 125 },
    { hour: "18:00", count: 118 },
    { hour: "19:00", count: 95 },
    { hour: "20:00", count: 78 },
    { hour: "21:00", count: 65 },
    { hour: "22:00", count: 42 },
    { hour: "23:00", count: 28 }
  ]

  const mockTopUsers: TopUser[] = [
    { username: "alex.brown", logins: 89, download: 5.7, upload: 4.3, group: "premium" },
    { username: "mike.wilson", logins: 67, download: 4.1, upload: 3.2, group: "premium" },
    { username: "john.doe", logins: 45, download: 2.3, upload: 1.8, group: "premium" },
    { username: "sarah.jones", logins: 28, download: 1.2, upload: 0.9, group: "basic" },
    { username: "jane.smith", logins: 32, download: 1.8, upload: 1.2, group: "standard" }
  ]

  const fetchServerData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setServerStats(mockServerStats)
      setTrafficData(mockTrafficData)
      setLoginData(mockLoginData)
      setTopUsers(mockTopUsers)
    } catch (error) {
      console.error("Error fetching server data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServerData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  const renderLoginChart = () => {
    const maxCount = Math.max(...loginData.map(d => d.count))
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Login Activity by Hour</h3>
          <div className="text-sm text-gray-500">
            Peak: {maxCount} logins
          </div>
        </div>
        <div className="grid grid-cols-12 gap-1">
          {loginData.map((data, index) => {
            const percentage = (data.count / maxCount) * 100
            return (
              <div key={index} className="space-y-1">
                <div className="text-xs text-center text-gray-600">{data.hour}</div>
                <div className="bg-gray-200 rounded-t h-32 flex items-end">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${percentage}%` }}
                    title={`${data.count} logins`}
                  />
                </div>
                <div className="text-xs text-center font-medium">{data.count}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderTrafficChart = () => {
    const maxTraffic = Math.max(...trafficData.map(d => d.download + d.upload))
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Traffic Comparison (GB)</h3>
          <div className="text-sm text-gray-500">
            Max: {maxTraffic.toFixed(1)} GB
          </div>
        </div>
        <div className="space-y-2">
          {trafficData.map((data, index) => {
            const downloadPercentage = (data.download / maxTraffic) * 100
            const uploadPercentage = (data.upload / maxTraffic) * 100
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{data.date}</span>
                  <span className="text-gray-600">
                    ↓{data.download}GB ↑{data.upload}GB
                  </span>
                </div>
                <div className="flex space-x-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${downloadPercentage}%` }}
                      title={`Download: ${data.download}GB`}
                    />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadPercentage}%` }}
                      title={`Upload: ${data.upload}GB`}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>↓ Download</span>
                  <span>↑ Upload</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const getGroupBadge = (group: string) => {
    const colors = {
      premium: "bg-purple-100 text-purple-800",
      standard: "bg-blue-100 text-blue-800",
      basic: "bg-gray-100 text-gray-800"
    }
    return (
      <Badge className={colors[group as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {group}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Server Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logins</p>
              <p className="text-2xl font-bold text-gray-900">{serverStats?.totalLogins.toLocaleString()}</p>
            </div>
            <LogIn className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{serverStats?.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Download</p>
              <p className="text-2xl font-bold text-gray-900">{serverStats?.totalDownload} TB</p>
            </div>
            <Download className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Upload</p>
              <p className="text-2xl font-bold text-gray-900">{serverStats?.totalUpload} TB</p>
            </div>
            <Upload className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Additional Server Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Server Uptime</p>
              <p className="text-lg font-bold text-gray-900">{serverStats?.uptime}</p>
            </div>
            <Server className="h-6 w-6 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peak Concurrent Users</p>
              <p className="text-lg font-bold text-gray-900">{serverStats?.peakConcurrentUsers}</p>
            </div>
            <Activity className="h-6 w-6 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Session Time</p>
              <p className="text-lg font-bold text-gray-900">{serverStats?.avgSessionTime}</p>
            </div>
            <Calendar className="h-6 w-6 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex space-x-1">
            <Button
              variant={activeGraph === "logins" ? "default" : "outline"}
              onClick={() => setActiveGraph("logins")}
              className="flex items-center space-x-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Logins/Hits</span>
            </Button>
            <Button
              variant={activeGraph === "traffic" ? "default" : "outline"}
              onClick={() => setActiveGraph("traffic")}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Traffic Comparison</span>
            </Button>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchServerData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Graph Display */}
      <Card className="p-6">
        <div className="h-96">
          {activeGraph === "logins" ? renderLoginChart() : renderTrafficChart()}
        </div>
      </Card>

      {/* Top Users Table */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Top Users by Activity</h3>
          <p className="text-sm text-gray-600">Users with highest login counts and data usage</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Logins</TableHead>
                <TableHead>Download (GB)</TableHead>
                <TableHead>Upload (GB)</TableHead>
                <TableHead>Total Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers.map((user, index) => (
                <TableRow key={user.username}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span>#{index + 1}</span>
                      <span>{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getGroupBadge(user.group)}</TableCell>
                  <TableCell>{user.logins}</TableCell>
                  <TableCell>{user.download}</TableCell>
                  <TableCell>{user.upload}</TableCell>
                  <TableCell className="font-medium">
                    {(user.download + user.upload).toFixed(1)} GB
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
