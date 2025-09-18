"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Download, Upload, ChevronLeft, ChevronRight } from "lucide-react"

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

export default function AllRecordsAccounting() {
  const [records, setRecords] = useState<AccountingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredRecords, setFilteredRecords] = useState<AccountingRecord[]>([])

  const recordsPerPage = 20

  // Fetch all accounting records
  const fetchRecords = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/radius/accounting/all?page=${page}&limit=${recordsPerPage}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records)
        setTotalPages(data.totalPages)
        setCurrentPage(page)
      } else {
        console.error("Failed to fetch accounting records")
      }
    } catch (error) {
      console.error("Error fetching accounting records:", error)
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
    fetchRecords(1)
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

  const displayRecords = searchTerm ? filteredRecords : records

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                All Accounting Records
              </CardTitle>
              <CardDescription>
                Comprehensive view of all accounting records in the radius database
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchRecords(currentPage)}
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

      {/* Results */}
      {displayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {searchTerm ? `Filtered Results (${displayRecords.length})` : `All Records (Page ${currentPage} of ${totalPages})`}
            </CardTitle>
            <CardDescription>
              {searchTerm 
                ? `Found ${displayRecords.length} matching record(s)`
                : `Showing ${records.length} record(s) per page`
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
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Data Usage</TableHead>
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

            {/* Pagination */}
            {!searchTerm && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchRecords(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchRecords(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {displayRecords.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "No accounting records match your search criteria"
                : "No accounting records found in the database"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
