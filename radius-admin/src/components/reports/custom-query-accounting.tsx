"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, Code, Database, Download, Upload } from "lucide-react"

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

interface QueryTemplate {
  id: string
  name: string
  description: string
  query: string
}

export default function CustomQueryAccounting() {
  const [customQuery, setCustomQuery] = useState("")
  const [queryType, setQueryType] = useState("username")
  const [queryValue, setQueryValue] = useState("")
  const [records, setRecords] = useState<AccountingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing] = useState(false)
  const [queryTemplates, setQueryTemplates] = useState<QueryTemplate[]>([])

  useEffect(() => {
    // Predefined query templates
    const templates: QueryTemplate[] = [
      {
        id: "username",
        name: "By Username",
        description: "Search accounting records by username",
        query: "SELECT * FROM radacct WHERE username = ?"
      },
      {
        id: "ip-address",
        name: "By IP Address",
        description: "Search accounting records by framed IP address",
        query: "SELECT * FROM radacct WHERE framedipaddress = ?"
      },
      {
        id: "nas-ip",
        name: "By NAS IP",
        description: "Search accounting records by NAS IP address",
        query: "SELECT * FROM radacct WHERE nasipaddress = ?"
      },
      {
        id: "date-range",
        name: "By Date Range",
        description: "Search accounting records within date range",
        query: "SELECT * FROM radacct WHERE acctstarttime BETWEEN ? AND ?"
      },
      {
        id: "active-sessions",
        name: "Active Sessions",
        description: "Get all active accounting sessions",
        query: "SELECT * FROM radacct WHERE acctstoptime IS NULL"
      },
      {
        id: "high-usage",
        name: "High Usage Users",
        description: "Users with high data usage",
        query: "SELECT * FROM radacct WHERE (acctinputoctets + acctoutputoctets) > ? ORDER BY (acctinputoctets + acctoutputoctets) DESC"
      }
    ]
    setQueryTemplates(templates)
  }, [])

  // Execute custom query
  const executeQuery = async () => {
    if (!customQuery.trim()) return

    try {
      setLoading(true)
      const response = await fetch("/api/radius/accounting/custom-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: customQuery,
          type: queryType,
          value: queryValue
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      } else {
        console.error("Failed to execute custom query")
      }
    } catch (error) {
      console.error("Error executing custom query:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load template
  const loadTemplate = (template: QueryTemplate) => {
    setCustomQuery(template.query)
    setQueryType(template.id)
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
      {/* Query Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Query Templates
          </CardTitle>
          <CardDescription>
            Predefined query templates for common accounting searches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queryTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                onClick={() => loadTemplate(template)}
              >
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 p-2 rounded">
                  {template.query}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Query Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Custom Accounting Query
          </CardTitle>
          <CardDescription>
            Perform custom accounting queries to extract specific data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="query-type">Query Type</Label>
              <Select value={queryType} onValueChange={setQueryType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select query type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="username">By Username</SelectItem>
                  <SelectItem value="ip-address">By IP Address</SelectItem>
                  <SelectItem value="nas-ip">By NAS IP</SelectItem>
                  <SelectItem value="date-range">By Date Range</SelectItem>
                  <SelectItem value="active-sessions">Active Sessions</SelectItem>
                  <SelectItem value="high-usage">High Usage Users</SelectItem>
                  <SelectItem value="custom">Custom SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {queryType !== "active-sessions" && queryType !== "custom" && (
              <div>
                <Label htmlFor="query-value">Query Value</Label>
                <Input
                  id="query-value"
                  placeholder="Enter search value"
                  value={queryValue}
                  onChange={(e) => setQueryValue(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="custom-query">SQL Query</Label>
              <Textarea
                id="custom-query"
                placeholder="Enter your custom SQL query..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={executeQuery} disabled={loading || !customQuery.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Executing..." : "Execute Query"}
              </Button>
              <Button
                variant="outline"
                onClick={executeQuery}
                disabled={refreshing || !customQuery.trim()}
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
            <CardTitle>Query Results</CardTitle>
            <CardDescription>
              Found {records.length} record(s) matching your query
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
      {customQuery && records.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">
              No accounting records match your custom query
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
