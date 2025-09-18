"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Server, Search, Filter, Clock, AlertTriangle, Info, XCircle, CheckCircle } from "lucide-react"

interface RADIUSLogEntry {
  id: number
  timestamp: string
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL"
  component: string
  message: string
  user: string
  nas_ip: string
  session_id: string
  request_id: string
  details: string
}

export default function RADIUSServerLogReport() {
  const [logEntries, setLogEntries] = useState<RADIUSLogEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<RADIUSLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [componentFilter, setComponentFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("24h")

  // Fetch RADIUS server log entries
  const fetchLogEntries = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/radius/reports/radius-server-log")
      if (response.ok) {
        const data = await response.json()
        setLogEntries(data)
        setFilteredEntries(data)
      } else {
        console.error("Failed to fetch RADIUS server log entries")
      }
    } catch (error) {
      console.error("Error fetching RADIUS server log entries:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogEntries()
  }, [])

  // Filter log entries
  useEffect(() => {
    let filtered = logEntries

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.nas_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(entry => entry.level === levelFilter)
    }

    // Component filter
    if (componentFilter !== "all") {
      filtered = filtered.filter(entry => entry.component === componentFilter)
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
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= cutoffTime)
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredEntries(filtered)
  }, [logEntries, searchTerm, levelFilter, componentFilter, timeFilter])

  // Get level badge
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "DEBUG":
        return <Badge className="bg-gray-100 text-gray-800">DEBUG</Badge>
      case "INFO":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><Info className="h-3 w-3" />INFO</Badge>
      case "WARN":
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />WARN</Badge>
      case "ERROR":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />ERROR</Badge>
      case "FATAL":
        return <Badge className="bg-red-200 text-red-900 flex items-center gap-1"><XCircle className="h-3 w-3" />FATAL</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  // Get level icon
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "DEBUG":
        return <Info className="h-4 w-4 text-gray-500" />
      case "INFO":
        return <Info className="h-4 w-4 text-blue-500" />
      case "WARN":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "ERROR":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "FATAL":
        return <XCircle className="h-4 w-4 text-red-700" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  // Get unique components for filter
  const uniqueComponents = Array.from(new Set(logEntries.map(entry => entry.component)))

  // Get statistics
  const stats = {
    total: filteredEntries.length,
    debug: filteredEntries.filter(e => e.level === "DEBUG").length,
    info: filteredEntries.filter(e => e.level === "INFO").length,
    warn: filteredEntries.filter(e => e.level === "WARN").length,
    error: filteredEntries.filter(e => e.level === "ERROR").length,
    fatal: filteredEntries.filter(e => e.level === "FATAL").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading RADIUS server logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Server className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Debug</p>
                <p className="text-2xl font-bold text-gray-600">{stats.debug}</p>
              </div>
              <Info className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Info</p>
                <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
              </div>
              <Info className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warn}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.error}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fatal</p>
                <p className="text-2xl font-bold text-red-800">{stats.fatal}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                FreeRADIUS Server Log
              </CardTitle>
              <CardDescription>
                Monitor FreeRADIUS server logfile for authentication and accounting events
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogEntries}
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
                  placeholder="Search logs by message, component, user, or IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-32">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                  <SelectItem value="FATAL">FATAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={componentFilter} onValueChange={setComponentFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Component" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Components</SelectItem>
                  {uniqueComponents.map((component, index) => (
                    <SelectItem key={`${component}-${index}`} value={component}>
                      {component}
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

          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Log Entries Found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>NAS IP</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getLevelBadge(entry.level)}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{entry.component}</TableCell>
                    <TableCell className="text-sm max-w-md">
                      <div className="flex items-start gap-2">
                        {getLevelIcon(entry.level)}
                        <span className="truncate">{entry.message}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{entry.user || "N/A"}</TableCell>
                    <TableCell className="font-mono text-sm">{entry.nas_ip || "N/A"}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {entry.details}
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
