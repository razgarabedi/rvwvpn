"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, HardDrive, Search, Filter, Clock, AlertTriangle, Info, XCircle, CheckCircle, Zap } from "lucide-react"

interface BootLogEntry {
  id: number
  timestamp: string
  level: "EMERG" | "ALERT" | "CRIT" | "ERR" | "WARNING" | "NOTICE" | "INFO" | "DEBUG"
  subsystem: string
  message: string
  device: string
  driver: string
  memory_address: string
  irq: number
  cpu: number
  details: string
}

export default function BootLogReport() {
  const [logEntries, setLogEntries] = useState<BootLogEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<BootLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [subsystemFilter, setSubsystemFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("24h")

  // Fetch boot log entries
  const fetchLogEntries = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/radius/reports/boot-log")
      if (response.ok) {
        const data = await response.json()
        setLogEntries(data)
        setFilteredEntries(data)
      } else {
        console.error("Failed to fetch boot log entries")
      }
    } catch (error) {
      console.error("Error fetching boot log entries:", error)
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
        entry.subsystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(entry => entry.level === levelFilter)
    }

    // Subsystem filter
    if (subsystemFilter !== "all") {
      filtered = filtered.filter(entry => entry.subsystem === subsystemFilter)
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
  }, [logEntries, searchTerm, levelFilter, subsystemFilter, timeFilter])

  // Get level badge
  const getLevelBadge = (level: string) => {
    switch (level) {
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
        return <Badge variant="outline">{level}</Badge>
    }
  }

  // Get level icon
  const getLevelIcon = (level: string) => {
    switch (level) {
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

  // Get subsystem badge
  const getSubsystemBadge = (subsystem: string) => {
    switch (subsystem.toLowerCase()) {
      case "kernel":
        return <Badge className="bg-purple-100 text-purple-800">Kernel</Badge>
      case "memory":
        return <Badge className="bg-blue-100 text-blue-800">Memory</Badge>
      case "cpu":
        return <Badge className="bg-green-100 text-green-800">CPU</Badge>
      case "storage":
        return <Badge className="bg-orange-100 text-orange-800">Storage</Badge>
      case "network":
        return <Badge className="bg-cyan-100 text-cyan-800">Network</Badge>
      case "usb":
        return <Badge className="bg-pink-100 text-pink-800">USB</Badge>
      case "pci":
        return <Badge className="bg-indigo-100 text-indigo-800">PCI</Badge>
      default:
        return <Badge variant="outline">{subsystem}</Badge>
    }
  }

  // Get unique subsystems for filter
  const uniqueSubsystems = Array.from(new Set(logEntries.map(entry => entry.subsystem)))

  // Get statistics
  const stats = {
    total: filteredEntries.length,
    emerg: filteredEntries.filter(e => e.level === "EMERG").length,
    alert: filteredEntries.filter(e => e.level === "ALERT").length,
    crit: filteredEntries.filter(e => e.level === "CRIT").length,
    err: filteredEntries.filter(e => e.level === "ERR").length,
    warning: filteredEntries.filter(e => e.level === "WARNING").length,
    info: filteredEntries.filter(e => e.level === "INFO").length,
    kernel: filteredEntries.filter(e => e.subsystem.toLowerCase() === "kernel").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading boot logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <HardDrive className="h-8 w-8 text-gray-400" />
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
                <p className="text-sm font-medium text-gray-600">Kernel</p>
                <p className="text-2xl font-bold text-purple-600">{stats.kernel}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredEntries.filter(e => e.subsystem.toLowerCase() === "memory").length}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredEntries.filter(e => e.subsystem.toLowerCase() === "cpu").length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Boot Log (dmesg)
              </CardTitle>
              <CardDescription>
                Monitor boot and kernel messages from system startup
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
                  placeholder="Search logs by message, subsystem, device, or driver..."
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
            <div className="sm:w-48">
              <Select value={subsystemFilter} onValueChange={setSubsystemFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Subsystem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subsystems</SelectItem>
                  {uniqueSubsystems.map((subsystem, index) => (
                    <SelectItem key={`${subsystem}-${index}`} value={subsystem}>
                      {subsystem}
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
              <HardDrive className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                  <TableHead>Subsystem</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Message</TableHead>
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
                    <TableCell>
                      {getSubsystemBadge(entry.subsystem)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.device || "N/A"}</TableCell>
                    <TableCell className="font-mono text-sm">{entry.driver || "N/A"}</TableCell>
                    <TableCell className="text-sm max-w-md">
                      <div className="flex items-start gap-2">
                        {getLevelIcon(entry.level)}
                        <span className="truncate">{entry.message}</span>
                      </div>
                    </TableCell>
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
