"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit, 
  Trash2,
  CreditCard,
  DollarSign
} from "lucide-react"

interface POSDevice {
  id: number
  name: string
  location: string
  status: "active" | "inactive" | "maintenance"
  last_transaction: string
  total_sales: number
  transaction_count: number
  created_at: string
}

interface Transaction {
  id: number
  pos_device_id: number
  customer_name: string
  amount: number
  payment_method: "cash" | "card" | "paypal" | "other"
  status: "completed" | "pending" | "failed" | "refunded"
  items: string[]
  created_at: string
}

export default function POSManagement() {
  const [posDevices, setPosDevices] = useState<POSDevice[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<POSDevice | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  // Form data for POS device
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    status: "active" as "active" | "inactive" | "maintenance"
  })

  // Fetch POS devices
  const fetchPOSDevices = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/billing/pos")
      if (response.ok) {
        const data = await response.json()
        setPosDevices(data)
      }
    } catch (error) {
      console.error("Error fetching POS devices:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/billing/pos/transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  useEffect(() => {
    fetchPOSDevices()
    fetchTransactions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingDevice ? `/api/billing/pos/${editingDevice.id}` : "/api/billing/pos"
      const method = editingDevice ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchPOSDevices()
        setIsDialogOpen(false)
        setEditingDevice(null)
        setFormData({ name: "", location: "", status: "active" })
      }
    } catch (error) {
      console.error("Error saving POS device:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (device: POSDevice) => {
    setEditingDevice(device)
    setFormData({
      name: device.name,
      location: device.location,
      status: device.status
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this POS device?")) {
      try {
        const response = await fetch(`/api/billing/pos/${id}`, { method: "DELETE" })
        if (response.ok) {
          await fetchPOSDevices()
        }
      } catch (error) {
        console.error("Error deleting POS device:", error)
      }
    }
  }

  const filteredDevices = posDevices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      maintenance: "bg-yellow-100 text-yellow-800"
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return <DollarSign className="h-4 w-4" />
      case "card": return <CreditCard className="h-4 w-4" />
      case "paypal": return <CreditCard className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600"
      case "pending": return "text-yellow-600"
      case "failed": return "text-red-600"
      case "refunded": return "text-blue-600"
      default: return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">POS Management</h2>
          <p className="text-muted-foreground">Manage Point of Sales devices and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPOSDevices} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingDevice(null)
                setFormData({ name: "", location: "", status: "active" })
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add POS Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDevice ? "Edit POS Device" : "Add New POS Device"}
                </DialogTitle>
                <DialogDescription>
                  {editingDevice ? "Update the POS device information" : "Create a new POS device for your business"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Device Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Main Counter POS"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Main Store, Branch 1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as "active" | "inactive" | "maintenance" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingDevice ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* POS Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            POS Devices ({filteredDevices.length})
          </CardTitle>
          <CardDescription>
            Manage your Point of Sales devices and monitor their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Last Transaction</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>{getStatusBadge(device.status)}</TableCell>
                  <TableCell>${device.total_sales.toFixed(2)}</TableCell>
                  <TableCell>{device.transaction_count}</TableCell>
                  <TableCell>{new Date(device.last_transaction).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(device)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(device.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            Latest transactions from all POS devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono">#{transaction.id.toString().padStart(6, '0')}</TableCell>
                  <TableCell>{transaction.customer_name}</TableCell>
                  <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(transaction.payment_method)}
                      {transaction.payment_method}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
