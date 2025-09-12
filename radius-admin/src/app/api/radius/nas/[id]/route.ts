import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// PUT /api/radius/nas/[id] - Update a NAS device
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
    const nasId = parseInt(resolvedParams.id)
    if (isNaN(nasId)) {
      return NextResponse.json(
        { error: "Invalid NAS ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { nasname, shortname, type, ports, secret, server, community, description } = body

    // Validate required fields
    if (!nasname || !shortname || !secret) {
      return NextResponse.json(
        { error: "NAS name, short name, and secret are required" },
        { status: 400 }
      )
    }

    // Check if NAS exists
    const existingNAS = await prisma.nas.findUnique({
      where: { id: nasId }
    })

    if (!existingNAS) {
      return NextResponse.json(
        { error: "NAS device not found" },
        { status: 404 }
      )
    }

    // Check if new NAS name already exists (if changed)
    if (existingNAS.nasname !== nasname) {
      const nasNameExists = await prisma.nas.findFirst({
        where: {
          nasname: nasname,
          id: { not: nasId }
        }
      })

      if (nasNameExists) {
        return NextResponse.json(
          { error: "NAS name already exists" },
          { status: 409 }
        )
      }
    }

    // Update NAS device
    const updatedNAS = await prisma.nas.update({
      where: { id: nasId },
      data: {
        nasname,
        shortname,
        type: type || "other",
        ports: ports ? parseInt(ports) : null,
        secret,
        server: server || null,
        community: community || null,
        description: description || null
      }
    })

    return NextResponse.json(updatedNAS)
  } catch (error) {
    console.error("Error updating NAS device:", error)
    return NextResponse.json(
      { error: "Failed to update NAS device" },
      { status: 500 }
    )
  }
}

// DELETE /api/radius/nas/[id] - Delete a NAS device
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
    const nasId = parseInt(resolvedParams.id)
    if (isNaN(nasId)) {
      return NextResponse.json(
        { error: "Invalid NAS ID" },
        { status: 400 }
      )
    }

    // Check if NAS exists
    const existingNAS = await prisma.nas.findUnique({
      where: { id: nasId }
    })

    if (!existingNAS) {
      return NextResponse.json(
        { error: "NAS device not found" },
        { status: 404 }
      )
    }

    // Delete NAS device
    await prisma.nas.delete({
      where: { id: nasId }
    })

    return NextResponse.json({ message: "NAS device deleted successfully" })
  } catch (error) {
    console.error("Error deleting NAS device:", error)
    return NextResponse.json(
      { error: "Failed to delete NAS device" },
      { status: 500 }
    )
  }
}
