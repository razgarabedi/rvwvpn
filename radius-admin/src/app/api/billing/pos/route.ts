import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for POS devices
const mockPOSDevices = [
  {
    id: 1,
    name: "Main Counter POS",
    location: "Main Store",
    status: "active",
    last_transaction: "2024-01-15T10:30:00Z",
    total_sales: 15420.50,
    transaction_count: 1247,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    name: "Branch 1 POS",
    location: "Branch 1",
    status: "active",
    last_transaction: "2024-01-15T09:15:00Z",
    total_sales: 8930.25,
    transaction_count: 756,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 3,
    name: "Mobile POS",
    location: "Mobile Unit",
    status: "maintenance",
    last_transaction: "2024-01-14T16:45:00Z",
    total_sales: 3240.75,
    transaction_count: 289,
    created_at: "2024-01-01T00:00:00Z"
  }
]

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(mockPOSDevices)
  } catch (error) {
    console.error("Error fetching POS devices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, location, status } = body

    if (!name || !location) {
      return NextResponse.json({ error: "Name and location are required" }, { status: 400 })
    }

    const newDevice = {
      id: mockPOSDevices.length + 1,
      name,
      location,
      status: status || "active",
      last_transaction: new Date().toISOString(),
      total_sales: 0,
      transaction_count: 0,
      created_at: new Date().toISOString()
    }

    mockPOSDevices.push(newDevice)

    return NextResponse.json(newDevice, { status: 201 })
  } catch (error) {
    console.error("Error creating POS device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
