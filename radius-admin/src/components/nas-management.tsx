"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Server, Wifi, Search, Filter, Eye, EyeOff, MapPin, Shield, Network } from "lucide-react"

interface NASDevice {
  id: number
  nasname: string
  shortname: string
  type: string
  ports: number | null
  secret: string
  server: string | null
  community: string | null
  description: string | null
  created_at?: string
  updated_at?: string
}

interface NASFormData {
  nasname: string
  shortname: string
  type: string
  ports: string
  secret: string
  server: string
  community: string
  description: string
}

export default function NASManagement() {
  const [nasDevices, setNasDevices] = useState<NASDevice[]>([])
  const [filteredDevices, setFilteredDevices] = useState<NASDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNAS, setEditingNAS] = useState<NASDevice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [showSecrets, setShowSecrets] = useState<{ [key: number]: boolean }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [formData, setFormData] = useState<NASFormData>({
    nasname: "",
    shortname: "",
    type: "other",
    ports: "",
    secret: "",
    server: "",
    community: "",
    description: ""
  })

  // Load NAS devices
  const loadNASDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/radius/nas")
      if (response.ok) {
        const data = await response.json()
        setNasDevices(data)
        setFilteredDevices(data)
      } else {
        console.error("Failed to fetch NAS devices")
      }
    } catch (error) {
      console.error("Error loading NAS devices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNASDevices()
  }, [])

  // Filter devices based on search and type
  useEffect(() => {
    let filtered = nasDevices

    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.shortname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.nasname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(device => device.type === typeFilter)
    }

    setFilteredDevices(filtered)
  }, [nasDevices, searchTerm, typeFilter])

  // Create or update NAS device
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingNAS ? `/api/radius/nas/${editingNAS.id}` : "/api/radius/nas"
      const method = editingNAS ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ports: formData.ports ? parseInt(formData.ports) : null
        }),
      })

      if (response.ok) {
        await loadNASDevices()
        setIsDialogOpen(false)
        setEditingNAS(null)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save NAS device")
      }
    } catch (error) {
      console.error("Error saving NAS device:", error)
      alert("Failed to save NAS device")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete NAS device
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this NAS device? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/radius/nas/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadNASDevices()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete NAS device")
      }
    } catch (error) {
      console.error("Error deleting NAS device:", error)
      alert("Failed to delete NAS device")
    }
  }

  // Edit NAS device
  const handleEdit = (nas: NASDevice) => {
    setEditingNAS(nas)
    setFormData({
      nasname: nas.nasname,
      shortname: nas.shortname,
      type: nas.type,
      ports: nas.ports?.toString() || "",
      secret: nas.secret,
      server: nas.server || "",
      community: nas.community || "",
      description: nas.description || ""
    })
    setIsDialogOpen(true)
  }

  // Add new NAS device
  const handleAddNew = () => {
    setEditingNAS(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      nasname: "",
      shortname: "",
      type: "other",
      ports: "",
      secret: "",
      server: "",
      community: "",
      description: ""
    })
    setShowSecret(false)
  }

  // Toggle secret visibility for table
  const toggleSecretVisibility = (nasId: number) => {
    setShowSecrets(prev => ({
      ...prev,
      [nasId]: !prev[nasId]
    }))
  }

  // Get device type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "cisco":
        return "bg-blue-100 text-blue-800"
      case "juniper":
        return "bg-green-100 text-green-800"
      case "mikrotik":
        return "bg-orange-100 text-orange-800"
      case "fortinet":
        return "bg-red-100 text-red-800"
      case "pfsense":
        return "bg-purple-100 text-purple-800"
      case "openwrt":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get device type icon
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "cisco":
      case "juniper":
      case "fortinet":
        return <Network className="h-4 w-4" />
      case "mikrotik":
      case "openwrt":
        return <Wifi className="h-4 w-4" />
      case "pfsense":
        return <Shield className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading NAS devices...</p>
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
                <Server className="h-5 w-5" />
                NAS Management
              </CardTitle>
              <CardDescription>
                Manage Network Access Server devices for FreeRADIUS authentication
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create New NAS
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search NAS devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cisco">Cisco</SelectItem>
                  <SelectItem value="juniper">Juniper</SelectItem>
                  <SelectItem value="mikrotik">MikroTik</SelectItem>
                  <SelectItem value="fortinet">Fortinet</SelectItem>
                  <SelectItem value="pfsense">pfSense</SelectItem>
                  <SelectItem value="openwrt">OpenWrt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredDevices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || typeFilter !== "all" ? "No NAS Devices Found" : "No NAS Devices"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || typeFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first NAS device."
                }
              </p>
              {!searchTerm && typeFilter === "all" && (
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First NAS Device
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Ports</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((nas) => (
                  <TableRow key={nas.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{nas.shortname}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {nas.nasname}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(nas.type)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(nas.type)}`}>
                          {nas.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{nas.nasname}</TableCell>
                    <TableCell className="text-sm">
                      {nas.ports ? nas.ports.toString() : "Default"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span>
                          {showSecrets[nas.id] 
                            ? nas.secret 
                            : "••••••••••"
                          }
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleSecretVisibility(nas.id)}
                        >
                          {showSecrets[nas.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {nas.server || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {nas.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(nas)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(nas.id)}
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

      {/* Add/Edit NAS Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {editingNAS ? "Edit NAS Device" : "Create New NAS Device"}
            </DialogTitle>
            <DialogDescription>
              {editingNAS 
                ? "Update the NAS device configuration and settings."
                : "Configure a new Network Access Server device for FreeRADIUS authentication."
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
                    <Label htmlFor="nasname">NAS Name/IP Address *</Label>
                    <Input
                      id="nasname"
                      value={formData.nasname}
                      onChange={(e) => setFormData({ ...formData, nasname: e.target.value })}
                      placeholder="192.168.1.1 or nas.example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shortname">Short Name *</Label>
                    <Input
                      id="shortname"
                      value={formData.shortname}
                      onChange={(e) => setFormData({ ...formData, shortname: e.target.value })}
                      placeholder="office-router"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Device Type *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="cisco">Cisco</SelectItem>
                        <SelectItem value="juniper">Juniper</SelectItem>
                        <SelectItem value="mikrotik">MikroTik</SelectItem>
                        <SelectItem value="fortinet">Fortinet</SelectItem>
                        <SelectItem value="pfsense">pfSense</SelectItem>
                        <SelectItem value="openwrt">OpenWrt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ports">Ports</Label>
                    <Input
                      id="ports"
                      type="number"
                      value={formData.ports}
                      onChange={(e) => setFormData({ ...formData, ports: e.target.value })}
                      placeholder="1812,1813"
                    />
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="secret">RADIUS Secret *</Label>
                    <div className="relative">
                      <Input
                        id="secret"
                        type={showSecret ? "text" : "password"}
                        value={formData.secret}
                        onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                        placeholder="radius-secret"
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="server">Server</Label>
                    <Input
                      id="server"
                      value={formData.server}
                      onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                      placeholder="radius.example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="community">Community</Label>
                    <Input
                      id="community"
                      value={formData.community}
                      onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                      placeholder="public"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Office router - Main building"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setEditingNAS(null)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingNAS ? "Update NAS Device" : "Create NAS Device"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}