"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

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

interface MapEditProps {
  hotspots: HotSpot[]
  onHotspotSelect: (hotspot: HotSpot) => void
  onHotspotDelete: (hotspotId: number) => void
  onHotspotAdd: (hotspot: Omit<HotSpot, "id" | "created_at" | "updated_at">) => void
  selectedHotspot: HotSpot | null
}

// Custom marker icons based on status
const createCustomIcon = (status: string, isSelected: boolean = false) => {
  const color = status === "active" ? "green" : status === "inactive" ? "gray" : "red"
  const size = isSelected ? 25 : 20
  const borderWidth = isSelected ? 3 : 2
  
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${borderWidth}px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  })
}

// Component to handle map clicks for adding new hotspots
function MapClickHandler({ onHotspotAdd }: { onHotspotAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onHotspotAdd(lat, lng)
    },
  })
  return null
}

// Component to fit map bounds to show all markers
function FitBounds({ hotspots }: { hotspots: HotSpot[] }) {
  const map = useMap()

  useEffect(() => {
    if (hotspots.length > 0) {
      const bounds = L.latLngBounds(
        hotspots.map((hotspot) => [hotspot.latitude, hotspot.longitude])
      )
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, hotspots])

  return null
}

export default function MapEdit({ 
  hotspots, 
  onHotspotSelect, 
  onHotspotDelete, 
  onHotspotAdd,
  selectedHotspot 
}: MapEditProps) {
  const [newHotspotCoords, setNewHotspotCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Default center
  const defaultCenter: [number, number] = [40.7128, -74.0060] // New York City
  const defaultZoom = 10

  // CARTO basemap configuration
  const cartoBasemap = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
  const cartoAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

  // Handle map click for adding new hotspot
  const handleMapClick = (lat: number, lng: number) => {
    setNewHotspotCoords({ lat, lng })
    setIsAddingNew(true)
  }

  // Handle adding new hotspot
  const handleAddHotspot = (hotspotData: Omit<HotSpot, "id" | "created_at" | "updated_at">) => {
    onHotspotAdd(hotspotData)
    setNewHotspotCoords(null)
    setIsAddingNew(false)
  }

  // Handle canceling new hotspot
  const handleCancelAdd = () => {
    setNewHotspotCoords(null)
    setIsAddingNew(false)
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full"
      >
        <TileLayer
          url={cartoBasemap}
          attribution={cartoAttribution}
        />
        
        {/* Fit bounds to show all markers */}
        <FitBounds hotspots={hotspots} />
        
        {/* Map click handler for adding new hotspots */}
        <MapClickHandler onHotspotAdd={handleMapClick} />
        
        {/* Render markers for each hotspot */}
        {hotspots.map((hotspot) => (
          <Marker
            key={hotspot.id}
            position={[hotspot.latitude, hotspot.longitude]}
            icon={createCustomIcon(hotspot.status, selectedHotspot?.id === hotspot.id)}
            eventHandlers={{
              click: () => onHotspotSelect(hotspot),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm mb-2">{hotspot.name}</h3>
                <div className="space-y-1 text-xs">
                  <p><strong>IP:</strong> {hotspot.ip_address}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      hotspot.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : hotspot.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {hotspot.status}
                    </span>
                  </p>
                  {hotspot.description && (
                    <p><strong>Description:</strong> {hotspot.description}</p>
                  )}
                  <p><strong>Coordinates:</strong> {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}</p>
                </div>
                <div className="mt-2 space-x-1">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    onClick={() => onHotspotSelect(hotspot)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this HotSpot?")) {
                        onHotspotDelete(hotspot.id)
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Temporary marker for new hotspot being added */}
        {newHotspotCoords && (
          <Marker
            position={[newHotspotCoords.lat, newHotspotCoords.lng]}
            icon={L.divIcon({
              className: "custom-div-icon",
              html: `<div style="
                background-color: blue;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm mb-2">New HotSpot</h3>
                <p className="text-xs text-gray-600 mb-2">
                  Click &quot;Add HotSpot&quot; to create a new HotSpot at this location
                </p>
                <p className="text-xs">
                  <strong>Coordinates:</strong> {newHotspotCoords.lat.toFixed(4)}, {newHotspotCoords.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Add HotSpot Modal */}
      {isAddingNew && newHotspotCoords && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New HotSpot</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const name = formData.get("name") as string
              const ip_address = formData.get("ip_address") as string
              const description = formData.get("description") as string
              const status = formData.get("status") as string

              if (name && ip_address) {
                handleAddHotspot({
                  name,
                  ip_address,
                  latitude: newHotspotCoords.lat,
                  longitude: newHotspotCoords.lng,
                  description: description || undefined,
                  status: status as "active" | "inactive" | "maintenance"
                })
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HotSpot Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter HotSpot name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IP Address *
                  </label>
                  <input
                    type="text"
                    name="ip_address"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="active"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description (optional)"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Location:</strong> {newHotspotCoords.lat.toFixed(6)}, {newHotspotCoords.lng.toFixed(6)}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add HotSpot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
