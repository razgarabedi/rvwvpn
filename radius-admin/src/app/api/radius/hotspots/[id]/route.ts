import { NextRequest, NextResponse } from "next/server"

// Mock data - in production, this would be stored in a database
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

// GET /api/radius/hotspots/[id] - Get specific hotspot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const hotspot = mockHotspots.find(h => h.id === id)
    
    if (!hotspot) {
      return NextResponse.json(
        { error: "Hotspot not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(hotspot)
  } catch (error) {
    console.error("Error fetching hotspot:", error)
    return NextResponse.json(
      { error: "Failed to fetch hotspot" },
      { status: 500 }
    )
  }
}

// PUT /api/radius/hotspots/[id] - Update hotspot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const body = await request.json()
    
    const hotspotIndex = mockHotspots.findIndex(h => h.id === id)
    
    if (hotspotIndex === -1) {
      return NextResponse.json(
        { error: "Hotspot not found" },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.name || !body.ssid || !body.password || !body.location) {
      return NextResponse.json(
        { error: "Missing required fields: name, ssid, password, location" },
        { status: 400 }
      )
    }

    // Update hotspot
    const updatedHotspot = {
      ...mockHotspots[hotspotIndex],
      name: body.name,
      description: body.description || "",
      location: body.location,
      ssid: body.ssid,
      password: body.password,
      maxUsers: body.maxUsers || 50,
      sessionTimeout: body.sessionTimeout || 3600,
      idleTimeout: body.idleTimeout || 1800,
      status: body.status || "active",
      updated_at: new Date().toISOString()
    }

    mockHotspots[hotspotIndex] = updatedHotspot

    return NextResponse.json(updatedHotspot)
  } catch (error) {
    console.error("Error updating hotspot:", error)
    return NextResponse.json(
      { error: "Failed to update hotspot" },
      { status: 500 }
    )
  }
}

// DELETE /api/radius/hotspots/[id] - Delete hotspot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const hotspotIndex = mockHotspots.findIndex(h => h.id === id)
    
    if (hotspotIndex === -1) {
      return NextResponse.json(
        { error: "Hotspot not found" },
        { status: 404 }
      )
    }

    // Remove hotspot
    mockHotspots.splice(hotspotIndex, 1)

    return NextResponse.json({ message: "Hotspot deleted successfully" })
  } catch (error) {
    console.error("Error deleting hotspot:", error)
    return NextResponse.json(
      { error: "Failed to delete hotspot" },
      { status: 500 }
    )
  }
}
