"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, Calendar, Download, Upload } from "lucide-react"

interface AccountingRecord {
  id: number
  username: string
  nas_ip: string
  nas_name: string
  framed_ip: string
  session_start: string
  session_end: string
  session_time: number
  input_bytes: number
  output_bytes: number
  input_packets: number
  output_packets: number
  status: "active" | "completed" | "terminated"
  termination_cause: string
  nas_port: string
  calling_station_id: string
  called_station_id: string
}

export default function DateRangeAccounting() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [records, setRecords] = useState<AccountingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing] = useState(false)

  // Set default date range (last 7 days)
  useEffect(() => {
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(lastWeek.toISOString().split('T')[0])
  }, [])

  // Fetch accounting records by date range
  const fetchRecords = async () => {
    if (!startDate || !endDate) return

    try {
      setLoading(true)
      const response = await fetch(`/api/radius/accounting/date-range?start=${startDate}&end=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      } else {
        console.error("Failed to fetch accounting records")
      }
    } catch (error) {
      console.error("Error fetching accounting records:", error)
    } finally {
      setLoading(false)
    }
  }

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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case "terminated":
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Accounting
          </CardTitle>
          <CardDescription>
            Get accounting records within a specified date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">From Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">To Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchRecords} disabled={loading || !startDate || !endDate}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                onClick={fetchRecords}
                disabled={refreshing || !startDate || !endDate}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Accounting Records from {startDate} to {endDate}
            </CardTitle>
            <CardDescription>
              Found {records.length} accounting record(s)
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
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Data Usage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">{record.id}</TableCell>
                      <TableCell className="font-medium">{record.username}</TableCell>
                      <TableCell className="font-mono">{record.nas_ip}</TableCell>
                      <TableCell className="font-mono">{record.framed_ip}</TableCell>
                      <TableCell>
                        {new Date(record.session_start).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {record.session_end ? new Date(record.session_end).toLocaleString() : "N/A"}
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
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {startDate && endDate && records.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
            <p className="text-gray-600">
              No accounting records found for the selected date range
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
