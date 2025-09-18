"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Clock, Download, Upload, RefreshCw, TrendingUp, Users } from "lucide-react"

interface TopUser {
  id: number
  username: string
  total_bytes_in: number
  total_bytes_out: number
  total_bytes: number
  total_session_time: number
  total_sessions: number
  last_activity: string
  avg_session_time: number
  peak_usage_time: string
}

export default function TopUsersReport() {
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeFilter, setTimeFilter] = useState("7d")
  const [sortBy, setSortBy] = useState("bandwidth")
  const [limit, setLimit] = useState(10)

  // Fetch top users
  const fetchTopUsers = async () => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams({
        time: timeFilter,
        sort: sortBy,
        limit: limit.toString()
      })

      const response = await fetch(`/api/radius/reports/top-users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTopUsers(data)
      } else {
        console.error("Failed to fetch top users")
      }
    } catch (error) {
      console.error("Error fetching top users:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTopUsers()
  }, [timeFilter, sortBy, limit])

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return `${seconds}s`
    }
  }

  // Get rank badge color
  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-100 text-yellow-800"
      case 1:
        return "bg-gray-100 text-gray-800"
      case 2:
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  // Get rank icon
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-600" />
      case 1:
        return <Trophy className="h-4 w-4 text-gray-600" />
      case 2:
        return <Trophy className="h-4 w-4 text-orange-600" />
      default:
        return <TrendingUp className="h-4 w-4 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading top users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Users
              </CardTitle>
              <CardDescription>
                Users ranked by bandwidth consumption and time usage
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTopUsers}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="sm:w-32">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bandwidth">Total Bandwidth</SelectItem>
                  <SelectItem value="time">Total Time</SelectItem>
                  <SelectItem value="sessions">Number of Sessions</SelectItem>
                  <SelectItem value="download">Download Volume</SelectItem>
                  <SelectItem value="upload">Upload Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-32">
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger>
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="25">Top 25</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">Top 100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {topUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                No usage data found for the selected time period.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="bandwidth" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bandwidth">Bandwidth Usage</TabsTrigger>
                <TabsTrigger value="time">Time Usage</TabsTrigger>
              </TabsList>
              
              <TabsContent value="bandwidth">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Total Bandwidth</TableHead>
                      <TableHead>Download</TableHead>
                      <TableHead>Upload</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRankIcon(index)}
                            <Badge className={getRankBadgeColor(index)}>
                              #{index + 1}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatBytes(user.total_bytes)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-green-500" />
                            {formatBytes(user.total_bytes_in)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Upload className="h-3 w-3 text-blue-500" />
                            {formatBytes(user.total_bytes_out)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.total_sessions}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.last_activity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="time">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Total Time</TableHead>
                      <TableHead>Avg Session</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Peak Usage</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRankIcon(index)}
                            <Badge className={getRankBadgeColor(index)}>
                              #{index + 1}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatTime(user.total_session_time)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTime(user.avg_session_time)}
                        </TableCell>
                        <TableCell className="text-sm">{user.total_sessions}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.peak_usage_time).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.last_activity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
