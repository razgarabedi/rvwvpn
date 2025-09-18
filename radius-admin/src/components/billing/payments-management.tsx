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
import { Textarea } from "@/components/ui/textarea"
import { 
  Receipt, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Download,
  CreditCard,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

interface Payment {
  id: number
  payment_number: string
  customer_id: number
  customer_name: string
  customer_email: string
  invoice_id?: number
  invoice_number?: string
  amount: number
  currency: string
  payment_method: "cash" | "credit_card" | "bank_transfer" | "paypal" | "check" | "other"
  payment_status: "pending" | "completed" | "failed" | "cancelled" | "refunded"
  transaction_id?: string
  reference_number?: string
  notes: string
  payment_date: string
  processed_date?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  // Form data for payment
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    amount: 0,
    currency: "USD",
    payment_method: "cash" as "cash" | "credit_card" | "bank_transfer" | "paypal" | "check" | "other",
    payment_status: "pending" as "pending" | "completed" | "failed" | "cancelled" | "refunded",
    transaction_id: "",
    reference_number: "",
    notes: "",
    payment_date: new Date().toISOString().split('T')[0],
    invoice_id: ""
  })

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/billing/payments")
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingPayment ? `/api/billing/payments/${editingPayment.id}` : "/api/billing/payments"
      const method = editingPayment ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          invoice_id: formData.invoice_id ? parseInt(formData.invoice_id) : undefined
        })
      })

      if (response.ok) {
        await fetchPayments()
        setIsDialogOpen(false)
        setEditingPayment(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving payment:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customer_name: "",
      customer_email: "",
      amount: 0,
      currency: "USD",
      payment_method: "cash",
      payment_status: "pending",
      transaction_id: "",
      reference_number: "",
      notes: "",
      payment_date: new Date().toISOString().split('T')[0],
      invoice_id: ""
    })
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({
      customer_name: payment.customer_name,
      customer_email: payment.customer_email,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      transaction_id: payment.transaction_id || "",
      reference_number: payment.reference_number || "",
      notes: payment.notes,
      payment_date: payment.payment_date,
      invoice_id: payment.invoice_id?.toString() || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      try {
        const response = await fetch(`/api/billing/payments/${id}`, { method: "DELETE" })
        if (response.ok) {
          await fetchPayments()
        }
      } catch (error) {
        console.error("Error deleting payment:", error)
      }
    }
  }

  const handleProcess = async (payment: Payment) => {
    if (confirm(`Process payment ${payment.payment_number}?`)) {
      try {
        const response = await fetch(`/api/billing/payments/${payment.id}/process`, {
          method: "POST"
        })

        if (response.ok) {
          await fetchPayments()
          alert("Payment processed successfully")
        } else {
          alert("Failed to process payment")
        }
      } catch (error) {
        console.error("Error processing payment:", error)
        alert("Error processing payment")
      }
    }
  }

  const handleRefund = async (payment: Payment) => {
    if (confirm(`Refund payment ${payment.payment_number}?`)) {
      try {
        const response = await fetch(`/api/billing/payments/${payment.id}/refund`, {
          method: "POST"
        })

        if (response.ok) {
          await fetchPayments()
          alert("Payment refunded successfully")
        } else {
          alert("Failed to refund payment")
        }
      } catch (error) {
        console.error("Error refunding payment:", error)
        alert("Error refunding payment")
      }
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/billing/payments/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusFilter,
          method: methodFilter,
          date_range: dateFilter
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting payments:", error)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.payment_status === statusFilter
    const matchesMethod = methodFilter === "all" || payment.payment_method === methodFilter
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const paymentDate = new Date(payment.payment_date)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
      
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
    
    return matchesSearch && matchesStatus && matchesMethod && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      refunded: "bg-blue-100 text-blue-800"
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return <DollarSign className="h-4 w-4 text-green-600" />
      case "credit_card": return <CreditCard className="h-4 w-4 text-blue-600" />
      case "bank_transfer": return <CreditCard className="h-4 w-4 text-purple-600" />
      case "paypal": return <CreditCard className="h-4 w-4 text-orange-600" />
      case "check": return <FileText className="h-4 w-4 text-gray-600" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const completedAmount = filteredPayments
    .filter(payment => payment.payment_status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0)
  const pendingAmount = filteredPayments
    .filter(payment => payment.payment_status === "pending")
    .reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments Management</h2>
          <p className="text-muted-foreground">Track and manage customer payments and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchPayments} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPayment(null)
                resetForm()
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPayment ? "Edit Payment" : "Record New Payment"}
                </DialogTitle>
                <DialogDescription>
                  {editingPayment ? "Update the payment information" : "Record a new payment from a customer"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="Customer name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Customer Email</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as "cash" | "credit_card" | "bank_transfer" | "paypal" | "check" | "other" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_status">Status</Label>
                    <Select
                      value={formData.payment_status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as "pending" | "completed" | "failed" | "cancelled" | "refunded" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transaction_id">Transaction ID</Label>
                    <Input
                      id="transaction_id"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                      placeholder="Transaction reference"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reference_number">Reference Number</Label>
                    <Input
                      id="reference_number"
                      value={formData.reference_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                      placeholder="Reference number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="invoice_id">Invoice ID (Optional)</Label>
                  <Input
                    id="invoice_id"
                    type="number"
                    value={formData.invoice_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_id: e.target.value }))}
                    placeholder="Invoice ID"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Payment notes or comments"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingPayment ? "Update" : "Record"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">{filteredPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{formatCurrency(completedAmount, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingAmount, "USD")}</p>
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
              placeholder="Search payments..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payments ({filteredPayments.length})
          </CardTitle>
          <CardDescription>
            Track and manage all customer payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono font-medium">
                    {payment.payment_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.customer_name}</div>
                      <div className="text-sm text-gray-500">{payment.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMethodIcon(payment.payment_method)}
                      {payment.payment_method.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {payment.invoice_number ? (
                      <Badge variant="outline">{payment.invoice_number}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(payment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {payment.payment_status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => handleProcess(payment)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {payment.payment_status === "completed" && (
                        <Button size="sm" variant="outline" onClick={() => handleRefund(payment)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDelete(payment.id)}>
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
    </div>
  )
}
