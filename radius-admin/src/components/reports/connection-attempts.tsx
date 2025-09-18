"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Activity, Clock, MapPin, Search, Filter, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ConnectionAttempt {
  id: number
  username: string
  nas_ip: string
  nas_name: string
  framed_ip: string
  calling_station_id: string
  called_station_id: string
  reply: string
  authdate: string
  acctstarttime: string
  acctstoptime: string
  acctsessiontime: number
  acctinputoctets: number
  acctoutputoctets: number
  acctterminatecause: string
  nas_port: number
  session_id: string
}

export default function ConnectionAttemptsReport() {
  const [attempts, setAttempts] = useState<ConnectionAttempt[]>([])
  const [filteredAttempts, setFilteredAttempts] = useState<ConnectionAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [nasFilter, setNasFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("24h")

  // Fetch connection attempts
  const fetchAttempts = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/radius/reports/connection-attempts")
      if (response.ok) {
        const data = await response.json()
        setAttempts(data)
        setFilteredAttempts(data)
      } else {
        console.error("Failed to fetch connection attempts")
      }
    } catch (error) {
      console.error("Error fetching connection attempts:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAttempts()
  }, [])

  // Filter attempts
  useEffect(() => {
    let filtered = attempts

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(attempt =>
        attempt.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.framed_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.nas_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.calling_station_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(attempt => {
        if (statusFilter === "success") {
          return attempt.reply === "Access-Accept"
        } else if (statusFilter === "rejected") {
          return attempt.reply === "Access-Reject"
        } else if (statusFilter === "challenge") {
          return attempt.reply === "Access-Challenge"
        }
        return true
      })
    }

    // NAS filter
    if (nasFilter !== "all") {
      filtered = filtered.filter(attempt => attempt.nas_ip === nasFilter)
    }

    // Time filter
    const now = new Date()
    const timeFilterMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000
    }

    if (timeFilter !== "all") {
      const cutoffTime = new Date(now.getTime() - timeFilterMs[timeFilter as keyof typeof timeFilterMs])
      filtered = filtered.filter(attempt => new Date(attempt.authdate) >= cutoffTime)
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.authdate).getTime() - new Date(a.authdate).getTime())

    setFilteredAttempts(filtered)
  }, [attempts, searchTerm, statusFilter, nasFilter, timeFilter])

  // Get status badge
  const getStatusBadge = (reply: string) => {
    switch (reply) {
      case "Access-Accept":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Accepted</Badge>
      case "Access-Reject":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
      case "Access-Challenge":
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Challenge</Badge>
      default:
        return <Badge variant="outline">{reply}</Badge>
    }
  }

  // Get unique NAS devices for filter
  const uniqueNAS = Array.from(new Set(attempts.map(attempt => attempt.nas_ip)))
    .map(ip => {
      const attempt = attempts.find(a => a.nas_ip === ip)
      return { ip, name: attempt?.nas_name || ip }
    })

  // Get statistics
  const stats = {
    total: filteredAttempts.length,
    successful: filteredAttempts.filter(a => a.reply === "Access-Accept").length,
    rejected: filteredAttempts.filter(a => a.reply === "Access-Reject").length,
    challenge: filteredAttempts.filter(a => a.reply === "Access-Challenge").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading connection attempts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Last Connection Attempts
              </CardTitle>
              <CardDescription>
                Recent authentication attempts and their status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAttempts}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
            <div className="sm:w-32">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Successful</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={nasFilter} onValueChange={setNasFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="NAS Device" />
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
            <div className="sm:w-32">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Connection Attempts Found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>NAS Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Session Time</TableHead>
                  <TableHead>Data Usage</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{attempt.username}</div>
                        <div className="text-sm text-gray-500">
                          {attempt.calling_station_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {attempt.framed_ip || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">{attempt.nas_name}</div>
                          <div className="text-xs text-gray-500">{attempt.nas_ip}:{attempt.nas_port}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(attempt.reply)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {attempt.acctsessiontime ? `${Math.floor(attempt.acctsessiontime / 60)}m` : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {attempt.acctinputoctets || attempt.acctoutputoctets ? (
                        <div>
                          <div>↓ {Math.round((attempt.acctinputoctets || 0) / 1024)} KB</div>
                          <div>↑ {Math.round((attempt.acctoutputoctets || 0) / 1024)} KB</div>
                        </div>
                      ) : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(attempt.authdate).toLocaleString()}
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
