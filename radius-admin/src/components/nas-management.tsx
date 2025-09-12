"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Server, Wifi } from "lucide-react"

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
}

export default function NASManagement() {
  const [nasDevices, setNasDevices] = useState<NASDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNAS, setEditingNAS] = useState<NASDevice | null>(null)
  const [formData, setFormData] = useState({
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
      const response = await fetch("/api/radius/nas")
      if (response.ok) {
        const data = await response.json()
        setNasDevices(data)
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

  // Create or update NAS device
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        resetForm()
        setIsDialogOpen(false)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error saving NAS device:", error)
      alert("Failed to save NAS device")
    }
  }

  // Delete NAS device
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this NAS device?")) return

    try {
      const response = await fetch(`/api/radius/nas/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadNASDevices()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
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
    setEditingNAS(null)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading NAS devices...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">NAS Devices Management</h2>
          <p className="text-gray-600">Manage Network Access Server devices for FreeRADIUS</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add NAS Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNAS ? "Edit NAS Device" : "Create New NAS Device"}
              </DialogTitle>
              <DialogDescription>
                Configure Network Access Server device for FreeRADIUS authentication
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nasname" className="text-right">
                  NAS Name/IP
                </Label>
                <Input
                  id="nasname"
                  value={formData.nasname}
                  onChange={(e) => setFormData({ ...formData, nasname: e.target.value })}
                  className="col-span-3"
                  placeholder="192.168.1.1 or nas.example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shortname" className="text-right">
                  Short Name
                </Label>
                <Input
                  id="shortname"
                  value={formData.shortname}
                  onChange={(e) => setFormData({ ...formData, shortname: e.target.value })}
                  className="col-span-3"
                  placeholder="office-router"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="other">Other</option>
                  <option value="cisco">Cisco</option>
                  <option value="juniper">Juniper</option>
                  <option value="mikrotik">MikroTik</option>
                  <option value="fortinet">Fortinet</option>
                  <option value="pfsense">pfSense</option>
                  <option value="openwrt">OpenWrt</option>
                </select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ports" className="text-right">
                  Ports
                </Label>
                <Input
                  id="ports"
                  type="number"
                  value={formData.ports}
                  onChange={(e) => setFormData({ ...formData, ports: e.target.value })}
                  className="col-span-3"
                  placeholder="1812,1813"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="secret" className="text-right">
                  Secret
                </Label>
                <Input
                  id="secret"
                  type="password"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="col-span-3"
                  placeholder="radius-secret"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="server" className="text-right">
                  Server
                </Label>
                <Input
                  id="server"
                  value={formData.server}
                  onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                  className="col-span-3"
                  placeholder="radius.example.com"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="community" className="text-right">
                  Community
                </Label>
                <Input
                  id="community"
                  value={formData.community}
                  onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                  className="col-span-3"
                  placeholder="public"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Office router - Main building"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNAS ? "Update NAS Device" : "Create NAS Device"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* NAS Devices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            NAS Devices ({nasDevices.length})
          </CardTitle>
          <CardDescription>
            Network Access Server devices configured for FreeRADIUS
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nasDevices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No NAS devices found. Add your first NAS device to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {nasDevices.map((nas) => (
                <div key={nas.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Wifi className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-lg">{nas.shortname}</h3>
                        <p className="text-sm text-gray-500">{nas.nasname}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(nas)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(nas.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between py-1">
                        <span className="font-medium text-gray-600">Type:</span>
                        <span className="text-gray-900">{nas.type}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="font-medium text-gray-600">Ports:</span>
                        <span className="text-gray-900">{nas.ports || "Default"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="font-medium text-gray-600">Server:</span>
                        <span className="text-gray-900">{nas.server || "N/A"}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between py-1">
                        <span className="font-medium text-gray-600">Community:</span>
                        <span className="text-gray-900">{nas.community || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="font-medium text-gray-600">Secret:</span>
                        <span className="text-gray-900 font-mono">••••••••</span>
                      </div>
                      {nas.description && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-600">Description:</span>
                          <p className="text-gray-900 mt-1">{nas.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
