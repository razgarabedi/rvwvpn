"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  History, 
  Search, 
  RefreshCw, 
  Eye,
  Download,
  DollarSign,
  CreditCard
} from "lucide-react"

interface BillingHistoryItem {
  id: number
  customer_id: number
  customer_name: string
  customer_email: string
  transaction_type: "payment" | "refund" | "adjustment" | "invoice" | "subscription"
  amount: number
  currency: string
  status: "completed" | "pending" | "failed" | "cancelled"
  payment_method: "paypal" | "credit_card" | "bank_transfer" | "cash" | "other"
  description: string
  reference_id: string
  invoice_id?: string
  plan_id?: number
  plan_name?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export default function BillingHistory() {
  const [historyItems, setHistoryItems] = useState<BillingHistoryItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BillingHistoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [, setLoading] = useState(false)

  // Fetch billing history
  const fetchBillingHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/billing/history")
      if (response.ok) {
        const data = await response.json()
        setHistoryItems(data)
      }
    } catch (error) {
      console.error("Error fetching billing history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingHistory()
  }, [])

  const handleViewDetails = (item: BillingHistoryItem) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/billing/history/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeFilter,
          status: statusFilter,
          date_range: dateFilter
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting billing history:", error)
    }
  }

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || item.transaction_type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const itemDate = new Date(item.created_at)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (dateFilter) {
        case "today":
          matchesDate = daysDiff === 0
          break
        case "week":
          matchesDate = daysDiff <= 7
          break
        case "month":
          matchesDate = daysDiff <= 30
          break
        case "year":
          matchesDate = daysDiff <= 365
          break
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      payment: "bg-blue-100 text-blue-800",
      refund: "bg-orange-100 text-orange-800",
      adjustment: "bg-purple-100 text-purple-800",
      invoice: "bg-green-100 text-green-800",
      subscription: "bg-pink-100 text-pink-800"
    }
    return <Badge className={variants[type as keyof typeof variants]}>{type}</Badge>
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "paypal": return <CreditCard className="h-4 w-4 text-blue-600" />
      case "credit_card": return <CreditCard className="h-4 w-4 text-gray-600" />
      case "bank_transfer": return <CreditCard className="h-4 w-4 text-green-600" />
      case "cash": return <DollarSign className="h-4 w-4 text-green-600" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const totalRevenue = filteredItems
    .filter(item => item.transaction_type === "payment" && item.status === "completed")
    .reduce((sum, item) => sum + item.amount, 0)

  const totalRefunds = filteredItems
    .filter(item => item.transaction_type === "refund" && item.status === "completed")
    .reduce((sum, item) => sum + item.amount, 0)

  const netRevenue = totalRevenue - totalRefunds

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing History</h2>
          <p className="text-muted-foreground">Complete history of all billing transactions and activities</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchBillingHistory} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Refunds</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRefunds, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(netRevenue, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <History className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{filteredItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search billing history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Billing History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Billing History ({filteredItems.length})
          </CardTitle>
          <CardDescription>
            Complete transaction history and billing activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(item.created_at).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(item.created_at).toLocaleTimeString()}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.customer_name}</div>
                      <div className="text-sm text-gray-500">{item.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(item.transaction_type)}</TableCell>
                  <TableCell className="font-medium">
                    <span className={item.transaction_type === "refund" ? "text-red-600" : "text-green-600"}>
                      {item.transaction_type === "refund" ? "-" : ""}{formatCurrency(item.amount, item.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(item.payment_method)}
                      {item.payment_method.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.reference_id}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(item)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Detailed information for transaction {selectedItem?.reference_id}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reference ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{selectedItem.reference_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Transaction Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedItem.transaction_type)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-sm text-gray-600">{selectedItem.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer Email</Label>
                  <p className="text-sm text-gray-600">{selectedItem.customer_email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-gray-600 font-medium">
                    {formatCurrency(selectedItem.amount, selectedItem.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm text-gray-600">{selectedItem.payment_method.replace('_', ' ')}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600">{selectedItem.description}</p>
              </div>
              
              {selectedItem.plan_name && (
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p className="text-sm text-gray-600">{selectedItem.plan_name}</p>
                </div>
              )}
              
              {selectedItem.invoice_id && (
                <div>
                  <Label className="text-sm font-medium">Invoice ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{selectedItem.invoice_id}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedItem.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated At</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedItem.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Additional Data</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(selectedItem.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
