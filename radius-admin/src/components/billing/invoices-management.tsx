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
  FileText, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Download,
  Send,
  DollarSign,
  CreditCard
} from "lucide-react"

interface Invoice {
  id: number
  invoice_number: string
  customer_id: number
  customer_name: string
  customer_email: string
  customer_address: string
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  subtotal: number
  tax_amount: number
  total_amount: number
  currency: string
  due_date: string
  issue_date: string
  paid_date?: string
  payment_terms: string
  notes: string
  items: InvoiceItem[]
  created_at: string
  updated_at: string
}

interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  // Form data for invoice
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_address: "",
    due_date: "",
    payment_terms: "Net 30",
    notes: "",
    items: [] as InvoiceItem[]
  })

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/billing/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingInvoice ? `/api/billing/invoices/${editingInvoice.id}` : "/api/billing/invoices"
      const method = editingInvoice ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchInvoices()
        setIsDialogOpen(false)
        setEditingInvoice(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving invoice:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customer_name: "",
      customer_email: "",
      customer_address: "",
      due_date: "",
      payment_terms: "Net 30",
      notes: "",
      items: []
    })
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email,
      customer_address: invoice.customer_address,
      due_date: invoice.due_date,
      payment_terms: invoice.payment_terms,
      notes: invoice.notes,
      items: invoice.items
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        const response = await fetch(`/api/billing/invoices/${id}`, { method: "DELETE" })
        if (response.ok) {
          await fetchInvoices()
        }
      } catch (error) {
        console.error("Error deleting invoice:", error)
      }
    }
  }

  const handleSend = async (invoice: Invoice) => {
    if (confirm(`Send invoice ${invoice.invoice_number} to ${invoice.customer_email}?`)) {
      try {
        const response = await fetch(`/api/billing/invoices/${invoice.id}/send`, {
          method: "POST"
        })

        if (response.ok) {
          await fetchInvoices()
          alert("Invoice sent successfully")
        } else {
          alert("Failed to send invoice")
        }
      } catch (error) {
        console.error("Error sending invoice:", error)
        alert("Error sending invoice")
      }
    }
  }

  const handleMarkPaid = async (invoice: Invoice) => {
    if (confirm(`Mark invoice ${invoice.invoice_number} as paid?`)) {
      try {
        const response = await fetch(`/api/billing/invoices/${invoice.id}/mark-paid`, {
          method: "POST"
        })

        if (response.ok) {
          await fetchInvoices()
          alert("Invoice marked as paid")
        } else {
          alert("Failed to mark invoice as paid")
        }
      } catch (error) {
        console.error("Error marking invoice as paid:", error)
        alert("Error marking invoice as paid")
      }
    }
  }

  const handleDownload = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.invoice_number}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading invoice:", error)
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: "", quantity: 1, unit_price: 0, total_price: 0 }]
    }))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "unit_price") {
            updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const invoiceDate = new Date(invoice.issue_date)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))
      
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
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const overdueAmount = filteredInvoices
    .filter(invoice => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoices Management</h2>
          <p className="text-muted-foreground">Create, manage, and track customer invoices</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInvoices} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingInvoice(null)
                resetForm()
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
                </DialogTitle>
                <DialogDescription>
                  {editingInvoice ? "Update the invoice information" : "Create a new invoice for your customer"}
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

                <div>
                  <Label htmlFor="customer_address">Customer Address</Label>
                  <Textarea
                    id="customer_address"
                    value={formData.customer_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                    placeholder="Customer billing address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select
                      value={formData.payment_terms}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Invoice Items</Label>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-5 gap-2 items-end">
                        <div className="col-span-2">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                            placeholder="Qty"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            placeholder="Unit price"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Input
                            value={formatCurrency(item.total_price, "USD")}
                            disabled
                            className="text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes for the invoice"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingInvoice ? "Update" : "Create"}
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
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{filteredInvoices.length}</p>
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
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(paidAmount, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(overdueAmount, "USD")}</p>
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
              placeholder="Search invoices..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
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

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices ({filteredInvoices.length})
          </CardTitle>
          <CardDescription>
            Manage customer invoices and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.customer_name}</div>
                      <div className="text-sm text-gray-500">{invoice.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(invoice)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {invoice.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => handleSend(invoice)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.status === "sent" && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(invoice)}>
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDelete(invoice.id)}>
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
