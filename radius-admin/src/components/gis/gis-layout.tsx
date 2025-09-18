"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Eye, Edit, RefreshCw, Settings, Layers } from "lucide-react"
import MapView from "./map-view"
import MapEdit from "./map-edit"
import HotSpotDetails from "./hotspot-details"

type GISTabType = "view" | "edit"

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

export default function GISLayout() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<GISTabType>("view")
  const [hotspots, setHotspots] = useState<HotSpot[]>([])
  const [selectedHotspot, setSelectedHotspot] = useState<HotSpot | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Set mounted to true on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch hotspots data
  const fetchHotspots = async () => {
    try {
      const response = await fetch("/api/radius/hotspots")
      if (response.ok) {
        const data = await response.json()
        setHotspots(data)
      } else {
        console.error("Failed to fetch hotspots")
      }
    } catch (error) {
      console.error("Error fetching hotspots:", error)
    }
  }

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true)
    await fetchHotspots()
    setRefreshing(false)
  }

  // Load data on component mount
  useEffect(() => {
    fetchHotspots()
  }, [])

  // Handle hotspot selection
  const handleHotspotSelect = (hotspot: HotSpot) => {
    setSelectedHotspot(hotspot)
  }

  // Handle hotspot update
  const handleHotspotUpdate = (updatedHotspot: HotSpot) => {
    setHotspots(prev => 
      prev.map(hotspot => 
        hotspot.id === updatedHotspot.id ? updatedHotspot : hotspot
      )
    )
    setSelectedHotspot(updatedHotspot)
  }

  // Handle hotspot delete
  const handleHotspotDelete = (hotspotId: number) => {
    setHotspots(prev => prev.filter(hotspot => hotspot.id !== hotspotId))
    if (selectedHotspot?.id === hotspotId) {
      setSelectedHotspot(null)
    }
  }

  // Handle hotspot add
  const handleHotspotAdd = (newHotspot: Omit<HotSpot, "id" | "created_at" | "updated_at">) => {
    const hotspotWithId: HotSpot = {
      ...newHotspot,
      id: Math.max(...hotspots.map(h => h.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setHotspots(prev => [...prev, hotspotWithId])
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geographical Information System
          </CardTitle>
          <CardDescription>
            Monitor and manage deployed HotSpots using interactive maps with Leaflet and CARTO basemap
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GISTabType)}>
                <TabsList>
                  <TabsTrigger value="view" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Map
                  </TabsTrigger>
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Map
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshData} variant="outline" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total HotSpots</p>
                <p className="text-2xl font-bold">{hotspots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {hotspots.filter(h => h.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold">
                  {hotspots.filter(h => h.status === "inactive").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold">
                  {hotspots.filter(h => h.status === "maintenance").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {activeTab === "view" ? "HotSpots Map View" : "HotSpots Map Editor"}
              </CardTitle>
              <CardDescription>
                {activeTab === "view" 
                  ? "Click on HotSpot markers to view details" 
                  : "Click on the map to add new HotSpots or click existing markers to edit"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              {!mounted ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading map...</p>
                  </div>
                </div>
              ) : activeTab === "view" ? (
                <MapView 
                  hotspots={hotspots}
                  onHotspotSelect={handleHotspotSelect}
                />
              ) : (
                <MapEdit 
                  hotspots={hotspots}
                  onHotspotSelect={handleHotspotSelect}
                  onHotspotDelete={handleHotspotDelete}
                  onHotspotAdd={handleHotspotAdd}
                  selectedHotspot={selectedHotspot}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          {selectedHotspot ? (
            <HotSpotDetails 
              hotspot={selectedHotspot}
              onUpdate={handleHotspotUpdate}
              onDelete={handleHotspotDelete}
              isEditMode={activeTab === "edit"}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === "view" ? "Select a HotSpot" : "Add or Edit HotSpot"}
                </h3>
                <p className="text-gray-600">
                  {activeTab === "view" 
                    ? "Click on a HotSpot marker on the map to view its details"
                    : "Click on the map to add a new HotSpot or click an existing marker to edit"
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* HotSpots List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All HotSpots</CardTitle>
              <CardDescription>
                {hotspots.length} HotSpots deployed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {hotspots.map((hotspot) => (
                  <div
                    key={hotspot.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedHotspot?.id === hotspot.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleHotspotSelect(hotspot)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{hotspot.name}</h4>
                        <p className="text-xs text-gray-600">{hotspot.ip_address}</p>
                      </div>
                      {getStatusBadge(hotspot.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
