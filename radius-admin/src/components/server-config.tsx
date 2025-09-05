"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Server, Wifi, WifiOff } from "lucide-react"

interface RadiusServer {
  id: string
  name: string
  host: string
  port: number
  secret: string
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export default function ServerConfig() {
  const [servers, setServers] = useState<RadiusServer[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<RadiusServer | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: 1813,
    secret: "",
    description: "",
    isActive: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch servers from API
  const fetchServers = async () => {
    try {
      const response = await fetch("/api/radius/servers")
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      } else {
        console.error("Failed to fetch servers")
      }
    } catch (error) {
      console.error("Error fetching servers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingServer 
        ? `/api/radius/servers/${editingServer.id}`
        : "/api/radius/servers"
      
      const method = editingServer ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchServers() // Refresh the list
        setIsDialogOpen(false)
        setEditingServer(null)
        setFormData({
          name: "",
          host: "",
          port: 1813,
          secret: "",
          description: "",
          isActive: true
        })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save server configuration")
      }
    } catch (error) {
      console.error("Error saving server configuration:", error)
      alert("Failed to save server configuration")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit server
  const handleEdit = (server: RadiusServer) => {
    setEditingServer(server)
    setFormData({
      name: server.name,
      host: server.host,
      port: server.port,
      secret: server.secret,
      description: server.description || "",
      isActive: server.isActive
    })
    setIsDialogOpen(true)
  }

  // Handle delete server
  const handleDelete = async (serverId: string) => {
    if (!confirm("Are you sure you want to delete this server configuration?")) {
      return
    }

    try {
      const response = await fetch(`/api/radius/servers/${serverId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchServers() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete server configuration")
      }
    } catch (error) {
      console.error("Error deleting server configuration:", error)
      alert("Failed to delete server configuration")
    }
  }

  // Handle add new server
  const handleAddNew = () => {
    setEditingServer(null)
    setFormData({
      name: "",
      host: "",
      port: 1813,
      secret: "",
      description: "",
      isActive: true
    })
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading server configurations...</p>
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
                FreeRADIUS Server Configuration
              </CardTitle>
              <CardDescription>
                Manage FreeRADIUS server connections for accounting and authentication
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {servers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No server configurations found. Click &quot;Add Server&quot; to create your first configuration.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Host:Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-medium">{server.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {server.host}:{server.port}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {server.isActive ? (
                          <>
                            <Wifi className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">Inactive</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {server.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(server)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(server.id)}
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

      {/* Add/Edit Server Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingServer ? "Edit Server Configuration" : "Add New Server"}
            </DialogTitle>
            <DialogDescription>
              {editingServer 
                ? "Update the FreeRADIUS server configuration."
                : "Configure a new FreeRADIUS server connection."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Main RADIUS Server"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="host" className="text-right">
                  Host *
                </Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="col-span-3"
                  placeholder="192.168.1.100 or radius.example.com"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="port" className="text-right">
                  Port *
                </Label>
                <Input
                  id="port"
                  type="number"
                  min="1"
                  max="65535"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 1813 })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="secret" className="text-right">
                  Secret *
                </Label>
                <Input
                  id="secret"
                  type="password"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="col-span-3"
                  placeholder="Shared secret for authentication"
                  required
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
                  placeholder="Optional description for this server"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Active
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="text-sm text-gray-600">
                    {formData.isActive ? "Server is active" : "Server is inactive"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingServer ? "Update Server" : "Add Server"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
