import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/servers - Fetch all FreeRADIUS server configurations
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const servers = await prisma.radiusServerConfig.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(servers)
  } catch (error) {
    console.error("Error fetching FreeRADIUS servers:", error)
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    )
  }
}

// POST /api/radius/servers - Create a new FreeRADIUS server configuration
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, host, port, secret, description, isActive } = body

    // Validate required fields
    if (!name || !host || !port || !secret) {
      return NextResponse.json(
        { error: "Name, host, port, and secret are required" },
        { status: 400 }
      )
    }

    // Validate port number
    if (port < 1 || port > 65535) {
      return NextResponse.json(
        { error: "Port must be between 1 and 65535" },
        { status: 400 }
      )
    }

    // Check if server name already exists
    const existingServer = await prisma.radiusServerConfig.findUnique({
      where: { name }
    })

    if (existingServer) {
      return NextResponse.json(
        { error: "Server configuration with this name already exists" },
        { status: 409 }
      )
    }

    // Create new server configuration
    const newServer = await prisma.radiusServerConfig.create({
      data: {
        name,
        host,
        port: parseInt(port),
        secret,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(newServer, { status: 201 })
  } catch (error) {
    console.error("Error creating FreeRADIUS server:", error)
    return NextResponse.json(
      { error: "Failed to create server configuration" },
      { status: 500 }
    )
  }
}
