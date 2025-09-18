"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, FileText, Search, Filter, Clock, User, Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface DaloRADIUSLogEntry {
  id: number
  timestamp: string
  user: string
  action: string
  resource: string
  details: string
  ip_address: string
  user_agent: string
  status: "success" | "error" | "warning" | "info"
  session_id: string
}

export default function DaloRADIUSLogReport() {
  const [logEntries, setLogEntries] = useState<DaloRADIUSLogEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<DaloRADIUSLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("24h")

  // Fetch daloRADIUS log entries
  const fetchLogEntries = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/radius/reports/daloradius-log")
      if (response.ok) {
        const data = await response.json()
        setLogEntries(data)
        setFilteredEntries(data)
      } else {
        console.error("Failed to fetch daloRADIUS log entries")
      }
    } catch (error) {
      console.error("Error fetching daloRADIUS log entries:", error)
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
        entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.ip_address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter(entry => entry.action === actionFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(entry => entry.status === statusFilter)
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
  }, [logEntries, searchTerm, actionFilter, statusFilter, timeFilter])

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Success</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Warning</Badge>
      case "info":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><Activity className="h-3 w-3" />Info</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
      case "add":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "delete":
      case "remove":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "update":
      case "edit":
        return <Activity className="h-4 w-4 text-blue-500" />
      case "login":
      case "logout":
        return <User className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(logEntries.map(entry => entry.action)))

  // Get statistics
  const stats = {
    total: filteredEntries.length,
    success: filteredEntries.filter(e => e.status === "success").length,
    error: filteredEntries.filter(e => e.status === "error").length,
    warning: filteredEntries.filter(e => e.status === "warning").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading daloRADIUS logs...</p>
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
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success</p>
                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
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
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                daloRADIUS Interface Log
              </CardTitle>
              <CardDescription>
                Track all actions performed within the RazoRADIUS interface
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
                  placeholder="Search logs by user, action, resource, or IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-32">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action, index) => (
                    <SelectItem key={`${action}-${index}`} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-32">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
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
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{entry.user}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(entry.action)}
                        <span className="text-sm">{entry.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{entry.resource}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {entry.details}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.ip_address}</TableCell>
                    <TableCell>
                      {getStatusBadge(entry.status)}
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
