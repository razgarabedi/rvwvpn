import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// PUT /api/radius/servers/[id] - Update a FreeRADIUS server configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const serverId = resolvedParams.id

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

    // Check if server exists
    const existingServer = await prisma.radiusServerConfig.findUnique({
      where: { id: serverId }
    })

    if (!existingServer) {
      return NextResponse.json(
        { error: "Server configuration not found" },
        { status: 404 }
      )
    }

    // Check if name is being changed and if new name already exists
    if (existingServer.name !== name) {
      const nameExists = await prisma.radiusServerConfig.findFirst({
        where: {
          name: name,
          id: { not: serverId }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: "Server configuration with this name already exists" },
          { status: 409 }
        )
      }
    }

    // Update server configuration
    const updatedServer = await prisma.radiusServerConfig.update({
      where: { id: serverId },
      data: {
        name,
        host,
        port: parseInt(port),
        secret,
        description: description || null,
        isActive: isActive !== undefined ? isActive : existingServer.isActive
      }
    })

    return NextResponse.json(updatedServer)
  } catch (error) {
    console.error("Error updating FreeRADIUS server:", error)
    return NextResponse.json(
      { error: "Failed to update server configuration" },
      { status: 500 }
    )
  }
}

// DELETE /api/radius/servers/[id] - Delete a FreeRADIUS server configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const serverId = resolvedParams.id

    // Check if server exists
    const existingServer = await prisma.radiusServerConfig.findUnique({
      where: { id: serverId }
    })

    if (!existingServer) {
      return NextResponse.json(
        { error: "Server configuration not found" },
        { status: 404 }
      )
    }

    // Delete server configuration
    await prisma.radiusServerConfig.delete({
      where: { id: serverId }
    })

    return NextResponse.json({ message: "Server configuration deleted successfully" })
  } catch (error) {
    console.error("Error deleting FreeRADIUS server:", error)
    return NextResponse.json(
      { error: "Failed to delete server configuration" },
      { status: 500 }
    )
  }
}
