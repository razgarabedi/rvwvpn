"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Edit, Save, X, Trash2, Wifi, Calendar, Clock } from "lucide-react"

interface HotSpot {
  id: number
  name: string
  ip_address: string
  latitude: number
  longitude: number
  status: "active" | "inactive" | "maintenance"
  description?: string
  created_at: string
  updated_at: string
}

interface HotSpotDetailsProps {
  hotspot: HotSpot
  onUpdate: (hotspot: HotSpot) => void
  onDelete: (hotspotId: number) => void
  isEditMode: boolean
}

export default function HotSpotDetails({ hotspot, onUpdate, onDelete, isEditMode }: HotSpotDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: hotspot.name,
    ip_address: hotspot.ip_address,
    status: hotspot.status,
    description: hotspot.description || "",
  })

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedHotspot = {
      ...hotspot,
      ...formData,
      updated_at: new Date().toISOString(),
    }
    onUpdate(updatedHotspot)
    setIsEditing(false)
  }

  // Handle cancel editing
  const handleCancel = () => {
    setFormData({
      name: hotspot.name,
      ip_address: hotspot.ip_address,
      status: hotspot.status,
      description: hotspot.description || "",
    })
    setIsEditing(false)
  }

  // Handle delete
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this HotSpot? This action cannot be undone.")) {
      onDelete(hotspot.id)
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              {isEditing ? "Edit HotSpot" : "HotSpot Details"}
            </CardTitle>
            <CardDescription>
              {isEditing ? "Update HotSpot information" : "View and manage HotSpot details"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {isEditMode && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">HotSpot Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={formData.ip_address}
                onChange={(e) => setFormData(prev => ({ ...prev, ip_address: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as "active" | "inactive" | "maintenance" }))}
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold text-lg mb-2">{hotspot.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(hotspot.status)}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">IP Address</p>
                  <p className="text-sm text-gray-600">{hotspot.ip_address}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Coordinates</p>
                  <p className="text-sm text-gray-600">
                    {hotspot.latitude.toFixed(6)}, {hotspot.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              {hotspot.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-gray-600">{hotspot.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-600">{formatDate(hotspot.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-gray-600">{formatDate(hotspot.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isEditMode && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit HotSpot
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
