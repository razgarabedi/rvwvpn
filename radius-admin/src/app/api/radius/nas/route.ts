import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/nas - Fetch all NAS devices
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const nasDevices = await prisma.nas.findMany({
      orderBy: {
        nasname: 'asc'
      }
    })

    return NextResponse.json(nasDevices)
  } catch (error) {
    console.error("Error fetching NAS devices:", error)
    return NextResponse.json(
      { error: "Failed to fetch NAS devices" },
      { status: 500 }
    )
  }
}

// POST /api/radius/nas - Create a new NAS device
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Check if NAS already exists
    const existingNAS = await prisma.nas.findFirst({
      where: {
        nasname: nasname
      }
    })

    if (existingNAS) {
      return NextResponse.json(
        { error: "NAS device already exists" },
        { status: 409 }
      )
    }

    // Create new NAS device
    const newNAS = await prisma.nas.create({
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

    return NextResponse.json(newNAS, { status: 201 })
  } catch (error) {
    console.error("Error creating NAS device:", error)
    return NextResponse.json(
      { error: "Failed to create NAS device" },
      { status: 500 }
    )
  }
}

