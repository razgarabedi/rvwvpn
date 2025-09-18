"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Monitor, Search, Filter, Clock, AlertTriangle, Info, XCircle, CheckCircle, Shield } from "lucide-react"

interface SystemLogEntry {
  id: number
  timestamp: string
  facility: string
  severity: "EMERG" | "ALERT" | "CRIT" | "ERR" | "WARNING" | "NOTICE" | "INFO" | "DEBUG"
  hostname: string
  program: string
  pid: number
  message: string
  source: "syslog" | "messages" | "kern" | "auth" | "mail" | "daemon"
}

export default function SystemLogReport() {
  const [logEntries, setLogEntries] = useState<SystemLogEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<SystemLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [facilityFilter, setFacilityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("24h")

  // Fetch system log entries
  const fetchLogEntries = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/radius/reports/system-log")
      if (response.ok) {
        const data = await response.json()
        setLogEntries(data)
        setFilteredEntries(data)
      } else {
        console.error("Failed to fetch system log entries")
      }
    } catch (error) {
      console.error("Error fetching system log entries:", error)
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
        entry.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.facility.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter(entry => entry.severity === severityFilter)
    }

    // Facility filter
    if (facilityFilter !== "all") {
      filtered = filtered.filter(entry => entry.facility === facilityFilter)
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter(entry => entry.source === sourceFilter)
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
  }, [logEntries, searchTerm, severityFilter, facilityFilter, sourceFilter, timeFilter])

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "EMERG":
        return <Badge className="bg-red-200 text-red-900 flex items-center gap-1"><XCircle className="h-3 w-3" />EMERG</Badge>
      case "ALERT":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />ALERT</Badge>
      case "CRIT":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />CRIT</Badge>
      case "ERR":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />ERR</Badge>
      case "WARNING":
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />WARNING</Badge>
      case "NOTICE":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><Info className="h-3 w-3" />NOTICE</Badge>
      case "INFO":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" />INFO</Badge>
      case "DEBUG":
        return <Badge className="bg-gray-100 text-gray-800">DEBUG</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "EMERG":
      case "ALERT":
      case "CRIT":
      case "ERR":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "NOTICE":
        return <Info className="h-4 w-4 text-blue-500" />
      case "INFO":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "DEBUG":
        return <Info className="h-4 w-4 text-gray-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  // Get source badge
  const getSourceBadge = (source: string) => {
    switch (source) {
      case "syslog":
        return <Badge className="bg-blue-100 text-blue-800">syslog</Badge>
      case "messages":
        return <Badge className="bg-green-100 text-green-800">messages</Badge>
      case "kern":
        return <Badge className="bg-purple-100 text-purple-800">kern</Badge>
      case "auth":
        return <Badge className="bg-orange-100 text-orange-800">auth</Badge>
      case "mail":
        return <Badge className="bg-cyan-100 text-cyan-800">mail</Badge>
      case "daemon":
        return <Badge className="bg-gray-100 text-gray-800">daemon</Badge>
      default:
        return <Badge variant="outline">{source}</Badge>
    }
  }

  // Get unique facilities and sources for filters
  const uniqueFacilities = Array.from(new Set(logEntries.map(entry => entry.facility)))
  const uniqueSources = Array.from(new Set(logEntries.map(entry => entry.source)))

  // Get statistics
  const stats = {
    total: filteredEntries.length,
    emerg: filteredEntries.filter(e => e.severity === "EMERG").length,
    alert: filteredEntries.filter(e => e.severity === "ALERT").length,
    crit: filteredEntries.filter(e => e.severity === "CRIT").length,
    err: filteredEntries.filter(e => e.severity === "ERR").length,
    warning: filteredEntries.filter(e => e.severity === "WARNING").length,
    info: filteredEntries.filter(e => e.severity === "INFO").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading system logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Monitor className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.crit + stats.alert + stats.emerg}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.err}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Info</p>
                <p className="text-2xl font-bold text-green-600">{stats.info}</p>
              </div>
              <Info className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Syslog</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredEntries.filter(e => e.source === "syslog").length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredEntries.filter(e => e.source === "messages").length}
                </p>
              </div>
              <Monitor className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Log
              </CardTitle>
              <CardDescription>
                Monitor system logs including syslog and messages
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
                  placeholder="Search logs by message, program, hostname, or facility..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-32">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="EMERG">EMERG</SelectItem>
                  <SelectItem value="ALERT">ALERT</SelectItem>
                  <SelectItem value="CRIT">CRIT</SelectItem>
                  <SelectItem value="ERR">ERR</SelectItem>
                  <SelectItem value="WARNING">WARNING</SelectItem>
                  <SelectItem value="NOTICE">NOTICE</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-32">
              <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Facility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {uniqueFacilities.map((facility, index) => (
                    <SelectItem key={`${facility}-${index}`} value={facility}>
                      {facility}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-32">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map((source, index) => (
                    <SelectItem key={`${source}-${index}`} value={source}>
                      {source}
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
              <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                  <TableHead>Severity</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(entry.severity)}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{entry.facility}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(entry.severity)}
                        <span>{entry.program}</span>
                        <span className="text-xs text-gray-500">[{entry.pid}]</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.hostname}</TableCell>
                    <TableCell className="text-sm max-w-md">
                      <span className="truncate">{entry.message}</span>
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(entry.source)}
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
