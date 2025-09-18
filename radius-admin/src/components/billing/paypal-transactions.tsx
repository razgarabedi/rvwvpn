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
  CreditCard, 
  Search, 
  RefreshCw, 
  Eye,
  Download,
  DollarSign
} from "lucide-react"

interface PayPalTransaction {
  id: number
  transaction_id: string
  paypal_transaction_id: string
  customer_email: string
  customer_name: string
  amount: number
  currency: string
  status: "completed" | "pending" | "failed" | "cancelled" | "refunded" | "partially_refunded"
  payment_method: "paypal" | "credit_card" | "bank_transfer"
  description: string
  invoice_id?: string
  plan_id?: number
  plan_name?: string
  created_at: string
  updated_at: string
  paypal_fee: number
  net_amount: number
  refund_amount?: number
  refund_reason?: string
}

export default function PayPalTransactions() {
  const [transactions, setTransactions] = useState<PayPalTransaction[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<PayPalTransaction | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [, setLoading] = useState(false)

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/billing/paypal/transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error("Error fetching PayPal transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleViewDetails = (transaction: PayPalTransaction) => {
    setSelectedTransaction(transaction)
    setIsDialogOpen(true)
  }

  const handleRefund = async (transaction: PayPalTransaction) => {
    if (confirm(`Are you sure you want to refund $${transaction.amount.toFixed(2)} for transaction ${transaction.transaction_id}?`)) {
      try {
        const response = await fetch(`/api/billing/paypal/transactions/${transaction.id}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: transaction.amount,
            reason: "Customer request"
          })
        })

        if (response.ok) {
          await fetchTransactions()
          alert("Refund processed successfully")
        } else {
          alert("Failed to process refund")
        }
      } catch (error) {
        console.error("Error processing refund:", error)
        alert("Error processing refund")
      }
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/billing/paypal/transactions/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusFilter,
          date_range: dateFilter
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `paypal-transactions-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting transactions:", error)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const transactionDate = new Date(transaction.created_at)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24))
      
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
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      refunded: "bg-blue-100 text-blue-800",
      partially_refunded: "bg-orange-100 text-orange-800"
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status.replace('_', ' ')}</Badge>
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "paypal": return <CreditCard className="h-4 w-4 text-blue-600" />
      case "credit_card": return <CreditCard className="h-4 w-4 text-gray-600" />
      case "bank_transfer": return <CreditCard className="h-4 w-4 text-green-600" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalFees = filteredTransactions.reduce((sum, t) => sum + t.paypal_fee, 0)
  const netAmount = filteredTransactions.reduce((sum, t) => sum + t.net_amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PayPal Transactions</h2>
          <p className="text-muted-foreground">Monitor and manage PayPal payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchTransactions} variant="outline" size="sm">
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
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
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
                <p className="text-sm text-gray-600">PayPal Fees</p>
                <p className="text-2xl font-bold">{formatCurrency(totalFees, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(netAmount, "USD")}</p>
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
              placeholder="Search transactions..."
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            PayPal Transactions ({filteredTransactions.length})
          </CardTitle>
          <CardDescription>
            View and manage all PayPal payment transactions
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
                <TableHead>Plan</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {transaction.transaction_id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.customer_name}</div>
                      <div className="text-sm text-gray-500">{transaction.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(transaction.payment_method)}
                      {transaction.payment_method.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    {transaction.plan_name ? (
                      <Badge variant="outline">{transaction.plan_name}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(transaction)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {transaction.status === "completed" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRefund(transaction)}
                        >
                          Refund
                        </Button>
                      )}
                    </div>
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
              Detailed information for transaction {selectedTransaction?.transaction_id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Transaction ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{selectedTransaction.transaction_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">PayPal Transaction ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{selectedTransaction.paypal_transaction_id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-sm text-gray-600">{selectedTransaction.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer Email</Label>
                  <p className="text-sm text-gray-600">{selectedTransaction.customer_email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-gray-600 font-medium">
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">PayPal Fee</Label>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(selectedTransaction.paypal_fee, selectedTransaction.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Net Amount</Label>
                  <p className="text-sm text-gray-600 font-medium">
                    {formatCurrency(selectedTransaction.net_amount, selectedTransaction.currency)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm text-gray-600">{selectedTransaction.payment_method.replace('_', ' ')}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600">{selectedTransaction.description}</p>
              </div>
              
              {selectedTransaction.plan_name && (
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p className="text-sm text-gray-600">{selectedTransaction.plan_name}</p>
                </div>
              )}
              
              {selectedTransaction.refund_amount && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Refund Amount</Label>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(selectedTransaction.refund_amount, selectedTransaction.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Refund Reason</Label>
                    <p className="text-sm text-gray-600">{selectedTransaction.refund_reason}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedTransaction.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated At</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedTransaction.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
