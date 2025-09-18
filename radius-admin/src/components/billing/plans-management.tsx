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
  Package, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit, 
  Trash2
} from "lucide-react"

interface Plan {
  id: number
  name: string
  description: string
  price: number
  billing_cycle: "monthly" | "yearly" | "one-time"
  duration_days: number
  data_limit: number // in GB, -1 for unlimited
  speed_limit: number // in Mbps, -1 for unlimited
  concurrent_sessions: number
  status: "active" | "inactive" | "archived"
  features: string[]
  created_at: string
  updated_at: string
}

export default function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  // Form data for plan
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    billing_cycle: "monthly" as "monthly" | "yearly" | "one-time",
    duration_days: 30,
    data_limit: -1,
    speed_limit: -1,
    concurrent_sessions: 1,
    status: "active" as "active" | "inactive" | "archived",
    features: [] as string[]
  })

  // Fetch plans
  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/billing/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingPlan ? `/api/billing/plans/${editingPlan.id}` : "/api/billing/plans"
      const method = editingPlan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchPlans()
        setIsDialogOpen(false)
        setEditingPlan(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving plan:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      billing_cycle: "monthly",
      duration_days: 30,
      data_limit: -1,
      speed_limit: -1,
      concurrent_sessions: 1,
      status: "active",
      features: []
    })
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      duration_days: plan.duration_days,
      data_limit: plan.data_limit,
      speed_limit: plan.speed_limit,
      concurrent_sessions: plan.concurrent_sessions,
      status: plan.status,
      features: plan.features
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      try {
        const response = await fetch(`/api/billing/plans/${id}`, { method: "DELETE" })
        if (response.ok) {
          await fetchPlans()
        }
      } catch (error) {
        console.error("Error deleting plan:", error)
      }
    }
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      archived: "bg-red-100 text-red-800"
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getBillingCycleBadge = (cycle: string) => {
    const variants = {
      monthly: "bg-blue-100 text-blue-800",
      yearly: "bg-purple-100 text-purple-800",
      "one-time": "bg-orange-100 text-orange-800"
    }
    return <Badge className={variants[cycle as keyof typeof variants]}>{cycle}</Badge>
  }

  const formatDataLimit = (limit: number) => {
    return limit === -1 ? "Unlimited" : `${limit} GB`
  }

  const formatSpeedLimit = (limit: number) => {
    return limit === -1 ? "Unlimited" : `${limit} Mbps`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plans Management</h2>
          <p className="text-muted-foreground">Create and manage subscription plans for your customers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPlans} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPlan(null)
                resetForm()
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit Plan" : "Create New Plan"}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan ? "Update the plan information" : "Create a new subscription plan for your customers"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Basic Plan"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this plan includes..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="billing_cycle">Billing Cycle</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value as "monthly" | "yearly" | "one-time" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration_days">Duration (days)</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 30 }))}
                      placeholder="30"
                    />
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="data_limit">Data Limit (GB)</Label>
                    <Input
                      id="data_limit"
                      type="number"
                      value={formData.data_limit === -1 ? "" : formData.data_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_limit: e.target.value === "" ? -1 : parseInt(e.target.value) || -1 }))}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speed_limit">Speed Limit (Mbps)</Label>
                    <Input
                      id="speed_limit"
                      type="number"
                      value={formData.speed_limit === -1 ? "" : formData.speed_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, speed_limit: e.target.value === "" ? -1 : parseInt(e.target.value) || -1 }))}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <Label htmlFor="concurrent_sessions">Concurrent Sessions</Label>
                    <Input
                      id="concurrent_sessions"
                      type="number"
                      value={formData.concurrent_sessions}
                      onChange={(e) => setFormData(prev => ({ ...prev, concurrent_sessions: parseInt(e.target.value) || 1 }))}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Enter feature..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addFeature}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingPlan ? "Update" : "Create"}
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
              placeholder="Search plans..."
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
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Subscription Plans ({filteredPlans.length})
          </CardTitle>
          <CardDescription>
            Manage your subscription plans and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Data Limit</TableHead>
                <TableHead>Speed Limit</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-gray-500">{plan.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${plan.price.toFixed(2)}</TableCell>
                  <TableCell>{getBillingCycleBadge(plan.billing_cycle)}</TableCell>
                  <TableCell>{formatDataLimit(plan.data_limit)}</TableCell>
                  <TableCell>{formatSpeedLimit(plan.speed_limit)}</TableCell>
                  <TableCell>{plan.concurrent_sessions}</TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(plan.id)}>
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
