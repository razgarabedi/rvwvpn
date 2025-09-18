import { NextRequest, NextResponse } from "next/server"

// Mock data for demonstration - in production, this would connect to your database
const mockHotspots = [
  {
    id: 1,
    name: "Main Office WiFi",
    description: "Primary WiFi network for office employees",
    location: "Main Office Building",
    ssid: "RazoRADIUS-Office",
    password: "SecurePass123",
    maxUsers: 100,
    sessionTimeout: 3600,
    idleTimeout: 1800,
    status: "active",
    ip_address: "192.168.1.100",
    latitude: 40.7128,
    longitude: -74.0060,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    name: "Guest Network",
    description: "Public WiFi for visitors and guests",
    location: "Reception Area",
    ssid: "RazoRADIUS-Guest",
    password: "GuestAccess2024",
    maxUsers: 50,
    sessionTimeout: 1800,
    idleTimeout: 900,
    status: "active",
    ip_address: "192.168.1.101",
    latitude: 40.7589,
    longitude: -73.9851,
    created_at: "2024-01-20T14:15:00Z",
    updated_at: "2024-01-20T14:15:00Z"
  },
  {
    id: 3,
    name: "Conference Room WiFi",
    description: "Dedicated network for conference rooms",
    location: "Conference Room A",
    ssid: "RazoRADIUS-Conference",
    password: "MeetingRoom2024",
    maxUsers: 25,
    sessionTimeout: 7200,
    idleTimeout: 3600,
    status: "maintenance",
    ip_address: "192.168.1.102",
    latitude: 40.7505,
    longitude: -73.9934,
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-02-10T16:45:00Z"
  },
  {
    id: 4,
    name: "Cafeteria WiFi",
    description: "WiFi for cafeteria and break area",
    location: "Cafeteria",
    ssid: "RazoRADIUS-Cafeteria",
    password: "CafeAccess2024",
    maxUsers: 75,
    sessionTimeout: 1800,
    idleTimeout: 900,
    status: "active",
    ip_address: "192.168.1.103",
    latitude: 40.7614,
    longitude: -73.9776,
    created_at: "2024-02-15T11:20:00Z",
    updated_at: "2024-02-15T11:20:00Z"
  },
  {
    id: 5,
    name: "Library WiFi",
    description: "Quiet study area WiFi",
    location: "Library",
    ssid: "RazoRADIUS-Library",
    password: "StudyTime2024",
    maxUsers: 30,
    sessionTimeout: 14400,
    idleTimeout: 3600,
    status: "inactive",
    ip_address: "192.168.1.104",
    latitude: 40.7489,
    longitude: -73.9857,
    created_at: "2024-03-01T08:00:00Z",
    updated_at: "2024-03-05T14:30:00Z"
  },
  {
    id: 6,
    name: "Outdoor WiFi",
    description: "Outdoor seating area WiFi",
    location: "Outdoor Patio",
    ssid: "RazoRADIUS-Outdoor",
    password: "FreshAir2024",
    maxUsers: 40,
    sessionTimeout: 3600,
    idleTimeout: 1800,
    status: "active",
    ip_address: "192.168.1.105",
    latitude: 40.7648,
    longitude: -73.9808,
    created_at: "2024-03-10T13:45:00Z",
    updated_at: "2024-03-10T13:45:00Z"
  }
]

// GET /api/radius/hotspots - List all hotspots
export async function GET() {
  try {
    return NextResponse.json(mockHotspots)
  } catch (error) {
    console.error("Error fetching hotspots:", error)
    return NextResponse.json(
      { error: "Failed to fetch hotspots" },
      { status: 500 }
    )
  }
}

// POST /api/radius/hotspots - Create new hotspot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.ip_address || !body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: "Missing required fields: name, ip_address, latitude, longitude" },
        { status: 400 }
      )
    }

    // Create new hotspot
    const newHotspot = {
      id: mockHotspots.length + 1,
      name: body.name,
      description: body.description || "",
      location: body.location || "",
      ssid: body.ssid || `RazoRADIUS-${body.name.replace(/\s+/g, '-')}`,
      password: body.password || "DefaultPass123",
      maxUsers: body.maxUsers || 50,
      sessionTimeout: body.sessionTimeout || 3600,
      idleTimeout: body.idleTimeout || 1800,
      status: body.status || "active",
      ip_address: body.ip_address,
      latitude: body.latitude,
      longitude: body.longitude,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockHotspots.push(newHotspot)

    return NextResponse.json(newHotspot, { status: 201 })
  } catch (error) {
    console.error("Error creating hotspot:", error)
    return NextResponse.json(
      { error: "Failed to create hotspot" },
      { status: 500 }
    )
  }
}
