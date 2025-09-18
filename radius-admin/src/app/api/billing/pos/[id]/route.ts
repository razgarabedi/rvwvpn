import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for POS devices (in a real app, this would be in a database)
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const device = mockPOSDevices.find(d => d.id === parseInt(id))

    if (!device) {
      return NextResponse.json({ error: "POS device not found" }, { status: 404 })
    }

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error fetching POS device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, location, status } = body

    const deviceIndex = mockPOSDevices.findIndex(d => d.id === parseInt(id))
    if (deviceIndex === -1) {
      return NextResponse.json({ error: "POS device not found" }, { status: 404 })
    }

    if (!name || !location) {
      return NextResponse.json({ error: "Name and location are required" }, { status: 400 })
    }

    mockPOSDevices[deviceIndex] = {
      ...mockPOSDevices[deviceIndex],
      name,
      location,
      status: status || mockPOSDevices[deviceIndex].status
    }

    return NextResponse.json(mockPOSDevices[deviceIndex])
  } catch (error) {
    console.error("Error updating POS device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const deviceIndex = mockPOSDevices.findIndex(d => d.id === parseInt(id))

    if (deviceIndex === -1) {
      return NextResponse.json({ error: "POS device not found" }, { status: 404 })
    }

    mockPOSDevices.splice(deviceIndex, 1)

    return NextResponse.json({ message: "POS device deleted successfully" })
  } catch (error) {
    console.error("Error deleting POS device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
