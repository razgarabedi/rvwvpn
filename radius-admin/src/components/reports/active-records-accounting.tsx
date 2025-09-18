"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Activity, Clock, Download, Upload, AlertCircle } from "lucide-react"

interface ActiveAccountingRecord {
  id: number
  username: string
  nas_ip: string
  nas_name: string
  framed_ip: string
  session_start: string
  session_time: number
  input_bytes: number
  output_bytes: number
  input_packets: number
  output_packets: number
  nas_port: string
  calling_station_id: string
  called_station_id: string
  max_all_session: number
  expiration: string
  last_update: string
}

export default function ActiveRecordsAccounting() {
  const [records, setRecords] = useState<ActiveAccountingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredRecords, setFilteredRecords] = useState<ActiveAccountingRecord[]>([])

  // Fetch active accounting records
  const fetchRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/radius/accounting/active")
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      } else {
        console.error("Failed to fetch active accounting records")
      }
    } catch (error) {
      console.error("Error fetching active accounting records:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter records based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = records.filter(record =>
        record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.framed_ip.includes(searchTerm) ||
        record.nas_ip.includes(searchTerm) ||
        record.id.toString().includes(searchTerm)
      )
      setFilteredRecords(filtered)
    } else {
      setFilteredRecords(records)
    }
  }, [records, searchTerm])

  useEffect(() => {
    fetchRecords()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRecords, 30000)
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

  // Format duration
  const formatDuration = (seconds: number) => {
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

  // Check if session is near expiration
  const isNearExpiration = (expiration: string) => {
    const expTime = new Date(expiration).getTime()
    const now = new Date().getTime()
    const timeLeft = expTime - now
    return timeLeft < 300000 // 5 minutes
  }

  // Get session status
  const getSessionStatus = (record: ActiveAccountingRecord) => {
    if (isNearExpiration(record.expiration)) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  const displayRecords = searchTerm ? filteredRecords : records

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Accounting Records
              </CardTitle>
              <CardDescription>
                Monitor active accounting sessions using Max-All-Session attribute or Expiration attribute
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={fetchRecords}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by username, IP, or session ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{records.length}</div>
                <div className="text-sm text-gray-600">Active Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {records.reduce((total, record) => total + record.session_time, 0) > 0 
                    ? formatDuration(records.reduce((total, record) => total + record.session_time, 0))
                    : "0s"
                  }
                </div>
                <div className="text-sm text-gray-600">Total Session Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {formatBytes(records.reduce((total, record) => total + record.input_bytes, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Downloaded</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {formatBytes(records.reduce((total, record) => total + record.output_bytes, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Uploaded</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {displayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {searchTerm ? `Filtered Active Sessions (${displayRecords.length})` : `Active Sessions (${records.length})`}
            </CardTitle>
            <CardDescription>
              {searchTerm 
                ? `Found ${displayRecords.length} matching active session(s)`
                : `Currently active accounting sessions`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>NAS IP</TableHead>
                    <TableHead>Framed IP</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Session Time</TableHead>
                    <TableHead>Data Usage</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">{record.id}</TableCell>
                      <TableCell className="font-medium">{record.username}</TableCell>
                      <TableCell className="font-mono">{record.nas_ip}</TableCell>
                      <TableCell className="font-mono">{record.framed_ip}</TableCell>
                      <TableCell>
                        {new Date(record.session_start).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {formatDuration(record.session_time)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-green-600" />
                            {formatBytes(record.input_bytes)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Upload className="h-3 w-3 text-blue-600" />
                            {formatBytes(record.output_bytes)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-mono">
                            {new Date(record.expiration).toLocaleString()}
                          </div>
                          {isNearExpiration(record.expiration) && (
                            <div className="flex items-center gap-1 text-yellow-600 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Expiring Soon
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getSessionStatus(record)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {displayRecords.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "No active sessions match your search criteria"
                : "No active accounting sessions found"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
