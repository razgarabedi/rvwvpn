"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
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

interface MapViewProps {
  hotspots: HotSpot[]
  onHotspotSelect: (hotspot: HotSpot) => void
}

// Custom marker icons based on status
const createCustomIcon = (status: string) => {
  const color = status === "active" ? "green" : status === "inactive" ? "gray" : "red"
  
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// Component to fit map bounds to show all markers
function FitBounds({ hotspots }: { hotspots: HotSpot[] }) {
  const map = useMap()

  useEffect(() => {
    if (hotspots.length > 0) {
      const bounds = L.latLngBounds(
        hotspots.map((hotspot: HotSpot) => [hotspot.latitude, hotspot.longitude])
      )
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, hotspots])

  return null
}

export default function MapView({ hotspots, onHotspotSelect }: MapViewProps) {
  const mapRef = useRef<L.Map>(null)

  // Default center (can be changed based on your location)
  const defaultCenter: [number, number] = [40.7128, -74.0060] // New York City
  const defaultZoom = 10

  // CARTO basemap configuration
  const cartoBasemap = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
  const cartoAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

  return (
    <div className="w-full h-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          url={cartoBasemap}
          attribution={cartoAttribution}
        />
        
        {/* Fit bounds to show all markers */}
        <FitBounds hotspots={hotspots} />
        
        {/* Render markers for each hotspot */}
        {hotspots.map((hotspot) => (
          <Marker
            key={hotspot.id}
            position={[hotspot.latitude, hotspot.longitude]}
            icon={createCustomIcon(hotspot.status)}
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
                <button
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  onClick={() => onHotspotSelect(hotspot)}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
