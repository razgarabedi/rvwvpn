"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, Wifi, Download, Upload, BarChart3, Users, Clock, Activity } from "lucide-react"

interface HotSpotAccountingData {
  hotspot_id: number
  hotspot_name: string
  hotspot_ip: string
  unique_users: number
  total_hits: number
  average_time: number
  total_time: number
  last_activity: string
  status: "active" | "inactive" | "maintenance"
}

interface HotSpotComparison {
  hotspot_id: number
  hotspot_name: string
  hotspot_ip: string
  unique_users: number
  total_hits: number
  average_time: number
  total_time: number
  last_activity: string
  status: "active" | "inactive" | "maintenance"
  efficiency_score: number
  user_retention: number
}

export default function HotSpotsAccounting() {
  const [hotspots, setHotspots] = useState<HotSpotAccountingData[]>([])
  const [comparison, setComparison] = useState<HotSpotComparison[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedHotspots, setSelectedHotspots] = useState<number[]>([])
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  // Fetch hotspots accounting data
  const fetchHotspotsAccounting = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/radius/accounting/hotspots?start=${dateRange.start}&end=${dateRange.end}`)
      if (response.ok) {
        const data = await response.json()
        setHotspots(data)
      } else {
        console.error("Failed to fetch hotspots accounting data")
      }
    } catch (error) {
      console.error("Error fetching hotspots accounting data:", error)
    } finally {
      setLoading(false)
    }
  }, [dateRange.start, dateRange.end])

  // Compare selected hotspots
  const compareHotspots = async () => {
    if (selectedHotspots.length < 2) {
      alert("Please select at least 2 hotspots to compare")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/radius/accounting/hotspots/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hotspot_ids: selectedHotspots,
          start_date: dateRange.start,
          end_date: dateRange.end
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setComparison(data)
      } else {
        console.error("Failed to compare hotspots")
      }
    } catch (error) {
      console.error("Error comparing hotspots:", error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true)
    await fetchHotspotsAccounting()
    setRefreshing(false)
  }

  // Load data on component mount
  useEffect(() => {
    fetchHotspotsAccounting()
  }, [fetchHotspotsAccounting])

  // Format time duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }


  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            HotSpots Accounting
          </CardTitle>
          <CardDescription>
            Compare accounting data for different hotspots, including unique users, total hits, average time, and total time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchHotspotsAccounting} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Search"}
              </Button>
              <Button onClick={refreshData} variant="outline" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HotSpots List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            HotSpots Overview
          </CardTitle>
          <CardDescription>
            Select hotspots to compare their accounting data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {hotspots.length} hotspots found
              </p>
              <Button 
                onClick={compareHotspots} 
                disabled={selectedHotspots.length < 2}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Compare Selected ({selectedHotspots.length})
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>HotSpot Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Unique Users</TableHead>
                  <TableHead>Total Hits</TableHead>
                  <TableHead>Average Time</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotspots.map((hotspot) => (
                  <TableRow key={hotspot.hotspot_id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedHotspots.includes(hotspot.hotspot_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedHotspots(prev => [...prev, hotspot.hotspot_id])
                          } else {
                            setSelectedHotspots(prev => prev.filter(id => id !== hotspot.hotspot_id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{hotspot.hotspot_name}</TableCell>
                    <TableCell>{hotspot.hotspot_ip}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        {hotspot.unique_users}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4 text-green-500" />
                        {hotspot.total_hits.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        {formatDuration(hotspot.average_time)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-purple-500" />
                        {formatDuration(hotspot.total_time)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(hotspot.last_activity).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(hotspot.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              HotSpots Comparison
            </CardTitle>
            <CardDescription>
              Detailed comparison of selected hotspots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Comparing {comparison.length} hotspots
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>HotSpot Name</TableHead>
                    <TableHead>Unique Users</TableHead>
                    <TableHead>Total Hits</TableHead>
                    <TableHead>Average Time</TableHead>
                    <TableHead>Total Time</TableHead>
                    <TableHead>Efficiency Score</TableHead>
                    <TableHead>User Retention</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((hotspot) => (
                    <TableRow key={hotspot.hotspot_id}>
                      <TableCell className="font-medium">{hotspot.hotspot_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-500" />
                          {hotspot.unique_users}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4 text-green-500" />
                          {hotspot.total_hits.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-orange-500" />
                          {formatDuration(hotspot.average_time)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-purple-500" />
                          {formatDuration(hotspot.total_time)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={hotspot.efficiency_score > 80 ? "default" : hotspot.efficiency_score > 60 ? "secondary" : "destructive"}>
                          {hotspot.efficiency_score}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={hotspot.user_retention > 70 ? "default" : hotspot.user_retention > 50 ? "secondary" : "destructive"}>
                          {hotspot.user_retention}%
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(hotspot.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
