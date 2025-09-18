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
  Calculator, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit, 
  Trash2
} from "lucide-react"

interface Rate {
  id: number
  name: string
  description: string
  rate_type: "per_hour" | "per_day" | "per_month" | "per_gb" | "per_session" | "flat_rate"
  base_rate: number
  currency: string
  minimum_charge: number
  maximum_charge: number
  data_included: number // in GB, -1 for unlimited
  time_included: number // in hours, -1 for unlimited
  overage_rate: number // rate for overage usage
  discount_percentage: number
  discount_threshold: number // minimum amount for discount
  status: "active" | "inactive" | "archived"
  applicable_plans: number[] // plan IDs this rate applies to
  created_at: string
  updated_at: string
}

export default function RatesManagement() {
  const [rates, setRates] = useState<Rate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  // Form data for rate
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rate_type: "per_hour" as "per_hour" | "per_day" | "per_month" | "per_gb" | "per_session" | "flat_rate",
    base_rate: 0,
    currency: "USD",
    minimum_charge: 0,
    maximum_charge: 0,
    data_included: -1,
    time_included: -1,
    overage_rate: 0,
    discount_percentage: 0,
    discount_threshold: 0,
    status: "active" as "active" | "inactive" | "archived",
    applicable_plans: [] as number[]
  })

  // Fetch rates
  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/billing/rates")
      if (response.ok) {
        const data = await response.json()
        setRates(data)
      }
    } catch (error) {
      console.error("Error fetching rates:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingRate ? `/api/billing/rates/${editingRate.id}` : "/api/billing/rates"
      const method = editingRate ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchRates()
        setIsDialogOpen(false)
        setEditingRate(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving rate:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      rate_type: "per_hour",
      base_rate: 0,
      currency: "USD",
      minimum_charge: 0,
      maximum_charge: 0,
      data_included: -1,
      time_included: -1,
      overage_rate: 0,
      discount_percentage: 0,
      discount_threshold: 0,
      status: "active",
      applicable_plans: []
    })
  }

  const handleEdit = (rate: Rate) => {
    setEditingRate(rate)
    setFormData({
      name: rate.name,
      description: rate.description,
      rate_type: rate.rate_type,
      base_rate: rate.base_rate,
      currency: rate.currency,
      minimum_charge: rate.minimum_charge,
      maximum_charge: rate.maximum_charge,
      data_included: rate.data_included,
      time_included: rate.time_included,
      overage_rate: rate.overage_rate,
      discount_percentage: rate.discount_percentage,
      discount_threshold: rate.discount_threshold,
      status: rate.status,
      applicable_plans: rate.applicable_plans
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this rate?")) {
      try {
        const response = await fetch(`/api/billing/rates/${id}`, { method: "DELETE" })
        if (response.ok) {
          await fetchRates()
        }
      } catch (error) {
        console.error("Error deleting rate:", error)
      }
    }
  }

  const filteredRates = rates.filter(rate => {
    const matchesSearch = rate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rate.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || rate.rate_type === typeFilter
    const matchesStatus = statusFilter === "all" || rate.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      archived: "bg-red-100 text-red-800"
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getRateTypeBadge = (type: string) => {
    const variants = {
      per_hour: "bg-blue-100 text-blue-800",
      per_day: "bg-green-100 text-green-800",
      per_month: "bg-purple-100 text-purple-800",
      per_gb: "bg-orange-100 text-orange-800",
      per_session: "bg-pink-100 text-pink-800",
      flat_rate: "bg-gray-100 text-gray-800"
    }
    return <Badge className={variants[type as keyof typeof variants]}>{type.replace('_', ' ')}</Badge>
  }

  const formatDataIncluded = (data: number) => {
    return data === -1 ? "Unlimited" : `${data} GB`
  }

  const formatTimeIncluded = (time: number) => {
    return time === -1 ? "Unlimited" : `${time} hours`
  }

  const formatRate = (rate: number, type: string) => {
    const typeLabels = {
      per_hour: "/hour",
      per_day: "/day",
      per_month: "/month",
      per_gb: "/GB",
      per_session: "/session",
      flat_rate: "flat"
    }
    return `$${rate.toFixed(2)}${typeLabels[type as keyof typeof typeLabels]}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rates Management</h2>
          <p className="text-muted-foreground">Configure pricing rates and billing rules</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRates} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRate(null)
                resetForm()
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRate ? "Edit Rate" : "Create New Rate"}
                </DialogTitle>
                <DialogDescription>
                  {editingRate ? "Update the rate information" : "Create a new billing rate for your services"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Rate Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Standard Hourly Rate"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate_type">Rate Type</Label>
                    <Select
                      value={formData.rate_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, rate_type: value as "per_hour" | "per_day" | "per_month" | "per_gb" | "per_session" | "flat_rate" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="per_day">Per Day</SelectItem>
                        <SelectItem value="per_month">Per Month</SelectItem>
                        <SelectItem value="per_gb">Per GB</SelectItem>
                        <SelectItem value="per_session">Per Session</SelectItem>
                        <SelectItem value="flat_rate">Flat Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this rate and when it applies..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="base_rate">Base Rate ($)</Label>
                    <Input
                      id="base_rate"
                      type="number"
                      step="0.01"
                      value={formData.base_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_rate: parseFloat(e.target.value) || 0 }))}
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as "active" | "inactive" | "archived" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minimum_charge">Minimum Charge ($)</Label>
                    <Input
                      id="minimum_charge"
                      type="number"
                      step="0.01"
                      value={formData.minimum_charge}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_charge: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maximum_charge">Maximum Charge ($)</Label>
                    <Input
                      id="maximum_charge"
                      type="number"
                      step="0.01"
                      value={formData.maximum_charge}
                      onChange={(e) => setFormData(prev => ({ ...prev, maximum_charge: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_included">Data Included (GB)</Label>
                    <Input
                      id="data_included"
                      type="number"
                      value={formData.data_included === -1 ? "" : formData.data_included}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_included: e.target.value === "" ? -1 : parseInt(e.target.value) || -1 }))}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time_included">Time Included (hours)</Label>
                    <Input
                      id="time_included"
                      type="number"
                      value={formData.time_included === -1 ? "" : formData.time_included}
                      onChange={(e) => setFormData(prev => ({ ...prev, time_included: e.target.value === "" ? -1 : parseInt(e.target.value) || -1 }))}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="overage_rate">Overage Rate ($)</Label>
                    <Input
                      id="overage_rate"
                      type="number"
                      step="0.01"
                      value={formData.overage_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, overage_rate: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_percentage">Discount (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      step="0.01"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_threshold">Discount Threshold ($)</Label>
                    <Input
                      id="discount_threshold"
                      type="number"
                      step="0.01"
                      value={formData.discount_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_threshold: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingRate ? "Update" : "Create"}
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
              placeholder="Search rates..."
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
            <SelectItem value="per_hour">Per Hour</SelectItem>
            <SelectItem value="per_day">Per Day</SelectItem>
            <SelectItem value="per_month">Per Month</SelectItem>
            <SelectItem value="per_gb">Per GB</SelectItem>
            <SelectItem value="per_session">Per Session</SelectItem>
            <SelectItem value="flat_rate">Flat Rate</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Billing Rates ({filteredRates.length})
          </CardTitle>
          <CardDescription>
            Configure and manage your billing rates and pricing rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rate Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Data Included</TableHead>
                <TableHead>Time Included</TableHead>
                <TableHead>Overage Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rate.name}</div>
                      <div className="text-sm text-gray-500">{rate.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getRateTypeBadge(rate.rate_type)}</TableCell>
                  <TableCell className="font-medium">{formatRate(rate.base_rate, rate.rate_type)}</TableCell>
                  <TableCell>{formatDataIncluded(rate.data_included)}</TableCell>
                  <TableCell>{formatTimeIncluded(rate.time_included)}</TableCell>
                  <TableCell>${rate.overage_rate.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(rate.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(rate)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(rate.id)}>
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
