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
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-02-10T16:45:00Z"
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
    if (!body.name || !body.ssid || !body.password || !body.location) {
      return NextResponse.json(
        { error: "Missing required fields: name, ssid, password, location" },
        { status: 400 }
      )
    }

    // Create new hotspot
    const newHotspot = {
      id: mockHotspots.length + 1,
      name: body.name,
      description: body.description || "",
      location: body.location,
      ssid: body.ssid,
      password: body.password,
      maxUsers: body.maxUsers || 50,
      sessionTimeout: body.sessionTimeout || 3600,
      idleTimeout: body.idleTimeout || 1800,
      status: body.status || "active",
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
