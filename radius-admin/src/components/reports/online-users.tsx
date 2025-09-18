"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Users, Wifi, Clock, MapPin, Search, Filter } from "lucide-react"

interface OnlineUser {
  id: number
  username: string
  nas_ip: string
  nas_name: string
  framed_ip: string
  calling_station_id: string
  called_station_id: string
  session_time: number
  session_timeout: number
  idle_timeout: number
  bytes_in: number
  bytes_out: number
  packets_in: number
  packets_out: number
  start_time: string
  last_update: string
  nas_port: number
  session_id: string
}

export default function OnlineUsersReport() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [nasFilter, setNasFilter] = useState("all")
  const [sortBy, setSortBy] = useState("session_time")

  // Fetch online users
  const fetchOnlineUsers = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/radius/reports/online-users")
      if (response.ok) {
        const data = await response.json()
        setOnlineUsers(data)
        setFilteredUsers(data)
      } else {
        console.error("Failed to fetch online users")
      }
    } catch (error) {
      console.error("Error fetching online users:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOnlineUsers()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter and sort users
  useEffect(() => {
    let filtered = onlineUsers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.framed_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nas_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.calling_station_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // NAS filter
    if (nasFilter !== "all") {
      filtered = filtered.filter(user => user.nas_ip === nasFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "session_time":
          return b.session_time - a.session_time
        case "username":
          return a.username.localeCompare(b.username)
        case "bytes_in":
          return b.bytes_in - a.bytes_in
        case "bytes_out":
          return b.bytes_out - a.bytes_out
        case "start_time":
          return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        default:
          return 0
      }
    })

    setFilteredUsers(filtered)
  }, [onlineUsers, searchTerm, nasFilter, sortBy])

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
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Get unique NAS devices for filter
  const uniqueNAS = Array.from(new Set(onlineUsers.map(user => user.nas_ip)))
    .map(ip => {
      const user = onlineUsers.find(u => u.nas_ip === ip)
      return { ip, name: user?.nas_name || ip }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading online users...</p>
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
                <Users className="h-5 w-5" />
                Online Users
              </CardTitle>
              <CardDescription>
                Currently connected users across all NAS devices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                {filteredUsers.length} Online
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOnlineUsers}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users, IP addresses, or NAS devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={nasFilter} onValueChange={setNasFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by NAS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All NAS Devices</SelectItem>
                  {uniqueNAS.map((nas, index) => (
                    <SelectItem key={`${nas.ip}-${index}`} value={nas.ip}>
                      {nas.name} ({nas.ip})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session_time">Session Time</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="bytes_in">Bytes In</SelectItem>
                  <SelectItem value="bytes_out">Bytes Out</SelectItem>
                  <SelectItem value="start_time">Start Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || nasFilter !== "all" ? "No Users Found" : "No Online Users"}
              </h3>
              <p className="text-gray-600">
                {searchTerm || nasFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No users are currently connected to the system."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>NAS Device</TableHead>
                  <TableHead>Session Time</TableHead>
                  <TableHead>Data Usage</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          {user.calling_station_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.framed_ip}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">{user.nas_name}</div>
                          <div className="text-xs text-gray-500">{user.nas_ip}:{user.nas_port}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{formatTime(user.session_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>↓ {formatBytes(user.bytes_in)}</div>
                        <div>↑ {formatBytes(user.bytes_out)}</div>
                        <div className="text-xs text-gray-500">
                          {user.packets_in + user.packets_out} packets
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(user.start_time).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Online
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
