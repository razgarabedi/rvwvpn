import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// Helper function to determine if param is an ID or username
function isNumericId(param: string): boolean {
  return !isNaN(parseInt(param)) && isFinite(parseInt(param))
}

// PUT /api/radius/users/[param] - Update a RADIUS user (by ID or username)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const param = resolvedParams.param
    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    let existingUser
    let userId

    if (isNumericId(param)) {
      // Handle by ID
      userId = parseInt(param)
      existingUser = await prisma.radCheck.findUnique({
        where: { id: userId }
      })
    } else {
      // Handle by username
      const decodedUsername = decodeURIComponent(param)
      existingUser = await prisma.radCheck.findFirst({
        where: {
          username: decodedUsername,
          attribute: "Cleartext-Password"
        }
      })
      if (existingUser) {
        userId = existingUser.id
      }
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if username is being changed and if new username already exists
    if (existingUser.username !== username) {
      const usernameExists = await prisma.radCheck.findFirst({
        where: {
          username: username,
          attribute: "Cleartext-Password",
          id: { not: userId }
        }
      })

      if (usernameExists) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.radCheck.update({
      where: { id: userId },
      data: {
        username: username,
        value: password // Store as plaintext as per FreeRADIUS requirements
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating RADIUS user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// DELETE /api/radius/users/[param] - Delete a RADIUS user (by ID or username)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const param = resolvedParams.param

    let existingUser
    let userId

    if (isNumericId(param)) {
      // Handle by ID
      userId = parseInt(param)
      existingUser = await prisma.radCheck.findUnique({
        where: { id: userId }
      })
    } else {
      // Handle by username
      const decodedUsername = decodeURIComponent(param)
      existingUser = await prisma.radCheck.findFirst({
        where: {
          username: decodedUsername,
          attribute: "Cleartext-Password"
        }
      })
      if (existingUser) {
        userId = existingUser.id
      }
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Delete user
    await prisma.radCheck.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting RADIUS user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
