"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Download, 
  Upload, 
  LogIn, 
  Search, 
  RefreshCw, 
  Eye
} from "lucide-react"

interface UserStats {
  id: string
  username: string
  logins: number
  totalDownload: number
  totalUpload: number
  lastLogin: string
  avgSessionTime: string
  status: "online" | "offline"
  group: string
}

interface GraphData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    borderColor: string
  }[]
}

export default function UsersGraphs() {
  const [users, setUsers] = useState<UserStats[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserStats[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [timeRange, setTimeRange] = useState("7d")
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null)
  const [activeGraph, setActiveGraph] = useState<"logins" | "download" | "upload">("logins")

  // Mock data for demonstration
  const mockUsers: UserStats[] = [
    {
      id: "1",
      username: "john.doe",
      logins: 45,
      totalDownload: 2.3,
      totalUpload: 1.8,
      lastLogin: "2024-01-15 14:30:00",
      avgSessionTime: "2h 15m",
      status: "online",
      group: "premium"
    },
    {
      id: "2",
      username: "jane.smith",
      logins: 32,
      totalDownload: 1.8,
      totalUpload: 1.2,
      lastLogin: "2024-01-15 12:15:00",
      avgSessionTime: "1h 45m",
      status: "offline",
      group: "standard"
    },
    {
      id: "3",
      username: "mike.wilson",
      logins: 67,
      totalDownload: 4.1,
      totalUpload: 3.2,
      lastLogin: "2024-01-15 16:45:00",
      avgSessionTime: "3h 20m",
      status: "online",
      group: "premium"
    },
    {
      id: "4",
      username: "sarah.jones",
      logins: 28,
      totalDownload: 1.2,
      totalUpload: 0.9,
      lastLogin: "2024-01-14 18:20:00",
      avgSessionTime: "1h 30m",
      status: "offline",
      group: "basic"
    },
    {
      id: "5",
      username: "alex.brown",
      logins: 89,
      totalDownload: 5.7,
      totalUpload: 4.3,
      lastLogin: "2024-01-15 17:10:00",
      avgSessionTime: "4h 10m",
      status: "online",
      group: "premium"
    }
  ]

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    if (groupFilter !== "all") {
      filtered = filtered.filter(user => user.group === groupFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, groupFilter])


  const getStatusBadge = (status: string) => {
    return status === "online" ? (
      <Badge className="bg-green-100 text-green-800">Online</Badge>
    ) : (
      <Badge variant="outline">Offline</Badge>
    )
  }

  const generateGraphData = (type: "logins" | "download" | "upload"): GraphData => {
    const labels = filteredUsers.map(user => user.username)
    let data: number[] = []
    let label = ""
    let backgroundColor = ""
    let borderColor = ""

    switch (type) {
      case "logins":
        data = filteredUsers.map(user => user.logins)
        label = "Login Count"
        backgroundColor = "rgba(59, 130, 246, 0.5)"
        borderColor = "rgba(59, 130, 246, 1)"
        break
      case "download":
        data = filteredUsers.map(user => user.totalDownload)
        label = "Download (GB)"
        backgroundColor = "rgba(16, 185, 129, 0.5)"
        borderColor = "rgba(16, 185, 129, 1)"
        break
      case "upload":
        data = filteredUsers.map(user => user.totalUpload)
        label = "Upload (GB)"
        backgroundColor = "rgba(245, 158, 11, 0.5)"
        borderColor = "rgba(245, 158, 11, 1)"
        break
    }

    return {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor,
        borderColor
      }]
    }
  }

  const renderSimpleChart = (data: GraphData) => {
    const maxValue = Math.max(...data.datasets[0].data)
    const minValue = Math.min(...data.datasets[0].data)
    const range = maxValue - minValue || 1

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{data.datasets[0].label}</h3>
          <div className="text-sm text-gray-500">
            Max: {maxValue} | Min: {minValue}
          </div>
        </div>
        <div className="space-y-2">
          {data.labels.map((label, index) => {
            const value = data.datasets[0].data[index]
            const percentage = ((value - minValue) / range) * 100
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-gray-600">{value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: data.datasets[0].backgroundColor.replace('0.5', '1')
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchUsers} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Graph Tabs */}
      <Card className="p-4">
        <div className="flex space-x-1 mb-4">
          <Button
            variant={activeGraph === "logins" ? "default" : "outline"}
            onClick={() => setActiveGraph("logins")}
            className="flex items-center space-x-2"
          >
            <LogIn className="h-4 w-4" />
            <span>Logins/Hits</span>
          </Button>
          <Button
            variant={activeGraph === "download" ? "default" : "outline"}
            onClick={() => setActiveGraph("download")}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
          <Button
            variant={activeGraph === "upload" ? "default" : "outline"}
            onClick={() => setActiveGraph("upload")}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </Button>
        </div>

        {/* Graph Display */}
        <div className="h-64">
          {renderSimpleChart(generateGraphData(activeGraph))}
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">User Statistics</h3>
          <p className="text-sm text-gray-600">Detailed view of user connection attributes</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Logins</TableHead>
                <TableHead>Download (GB)</TableHead>
                <TableHead>Upload (GB)</TableHead>
                <TableHead>Avg Session</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.group}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.logins}</TableCell>
                  <TableCell>{user.totalDownload}</TableCell>
                  <TableCell>{user.totalUpload}</TableCell>
                  <TableCell>{user.avgSessionTime}</TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* User Details Modal would go here */}
      {selectedUser && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">User Details: {selectedUser.username}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span>{getStatusBadge(selectedUser.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Group:</span>
                <span className="capitalize">{selectedUser.group}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Logins:</span>
                <span>{selectedUser.logins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Download:</span>
                <span>{selectedUser.totalDownload} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Upload:</span>
                <span>{selectedUser.totalUpload} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Session Time:</span>
                <span>{selectedUser.avgSessionTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login:</span>
                <span>{selectedUser.lastLogin}</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
