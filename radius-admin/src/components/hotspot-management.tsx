"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Wifi, MapPin, Eye, EyeOff } from "lucide-react"

interface HotSpot {
  id: number
  name: string
  description: string
  location: string
  ssid: string
  password: string
  maxUsers: number
  sessionTimeout: number
  idleTimeout: number
  status: "active" | "inactive" | "maintenance"
  created_at: string
  updated_at: string
}

interface HotSpotFormData {
  name: string
  description: string
  location: string
  ssid: string
  password: string
  maxUsers: number
  sessionTimeout: number
  idleTimeout: number
  status: "active" | "inactive" | "maintenance"
}

export default function HotSpotManagement() {
  const [hotspots, setHotspots] = useState<HotSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHotspot, setEditingHotspot] = useState<HotSpot | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({})
  const [formData, setFormData] = useState<HotSpotFormData>({
    name: "",
    description: "",
    location: "",
    ssid: "",
    password: "",
    maxUsers: 50,
    sessionTimeout: 3600,
    idleTimeout: 1800,
    status: "active"
  })

  // Fetch hotspots from API
  const fetchHotspots = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/radius/hotspots")
      if (response.ok) {
        const data = await response.json()
        setHotspots(data)
      } else {
        console.error("Failed to fetch hotspots")
      }
    } catch (error) {
      console.error("Error fetching hotspots:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHotspots()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingHotspot 
        ? `/api/radius/hotspots/${editingHotspot.id}`
        : "/api/radius/hotspots"
      
      const method = editingHotspot ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchHotspots() // Refresh the list
        setIsDialogOpen(false)
        setEditingHotspot(null)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save hotspot")
      }
    } catch (error) {
      console.error("Error saving hotspot:", error)
      alert("Failed to save hotspot")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit hotspot
  const handleEdit = (hotspot: HotSpot) => {
    setEditingHotspot(hotspot)
    setFormData({
      name: hotspot.name,
      description: hotspot.description,
      location: hotspot.location,
      ssid: hotspot.ssid,
      password: hotspot.password,
      maxUsers: hotspot.maxUsers,
      sessionTimeout: hotspot.sessionTimeout,
      idleTimeout: hotspot.idleTimeout,
      status: hotspot.status
    })
    setIsDialogOpen(true)
  }

  // Handle delete hotspot
  const handleDelete = async (hotspotId: number) => {
    if (!confirm("Are you sure you want to delete this hotspot?")) {
      return
    }

    try {
      const response = await fetch(`/api/radius/hotspots/${hotspotId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchHotspots() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete hotspot")
      }
    } catch (error) {
      console.error("Error deleting hotspot:", error)
      alert("Failed to delete hotspot")
    }
  }

  // Handle add new hotspot
  const handleAddNew = () => {
    setEditingHotspot(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      ssid: "",
      password: "",
      maxUsers: 50,
      sessionTimeout: 3600,
      idleTimeout: 1800,
      status: "active"
    })
    setShowPassword(false)
  }

  // Toggle password visibility for table
  const togglePasswordVisibility = (hotspotId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [hotspotId]: !prev[hotspotId]
    }))
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading hotspots...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                HotSpot Management
              </CardTitle>
              <CardDescription>
                Manage WiFi hotspots, configure settings, and monitor usage
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create New HotSpot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hotspots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wifi className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No HotSpots Found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first hotspot.</p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First HotSpot
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SSID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Max Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotspots.map((hotspot) => (
                  <TableRow key={hotspot.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{hotspot.name}</div>
                        <div className="text-sm text-gray-500">{hotspot.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{hotspot.ssid}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{hotspot.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span>
                          {showPasswords[hotspot.id] 
                            ? hotspot.password 
                            : "••••••••••"
                          }
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => togglePasswordVisibility(hotspot.id)}
                        >
                          {showPasswords[hotspot.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{hotspot.maxUsers}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(hotspot.status)}`}>
                        {hotspot.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(hotspot.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(hotspot)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(hotspot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit HotSpot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              {editingHotspot ? "Edit HotSpot" : "Create New HotSpot"}
            </DialogTitle>
            <DialogDescription>
              {editingHotspot 
                ? "Update the hotspot configuration and settings."
                : "Configure a new WiFi hotspot with its settings and parameters."
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">HotSpot Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter hotspot name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssid">SSID (Network Name) *</Label>
                    <Input
                      id="ssid"
                      value={formData.ssid}
                      onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                      placeholder="Enter WiFi network name"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter hotspot description"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">WiFi Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter WiFi password"
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxUsers">Maximum Users</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: "active" | "inactive" | "maintenance") => setFormData({ ...formData, status: value })}
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
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={formData.sessionTimeout}
                      onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) || 0 })}
                      min="60"
                      max="86400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="idleTimeout">Idle Timeout (seconds)</Label>
                    <Input
                      id="idleTimeout"
                      type="number"
                      value={formData.idleTimeout}
                      onChange={(e) => setFormData({ ...formData, idleTimeout: parseInt(e.target.value) || 0 })}
                      min="60"
                      max="86400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setEditingHotspot(null)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingHotspot ? "Update HotSpot" : "Create HotSpot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
