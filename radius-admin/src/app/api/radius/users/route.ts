import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/users - Fetch all RADIUS users
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.radCheck.findMany({
      orderBy: {
        username: 'asc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching RADIUS users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// POST /api/radius/users - Create a new RADIUS user
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.radCheck.findFirst({
      where: {
        username: username,
        attribute: "Cleartext-Password"
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      )
    }

    // Create new user
    const newUser = await prisma.radCheck.create({
      data: {
        username: username,
        attribute: "Cleartext-Password",
        op: ":=",
        value: password // Store as plaintext as per FreeRADIUS requirements
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating RADIUS user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}
