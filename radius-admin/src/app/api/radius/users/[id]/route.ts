import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// PUT /api/radius/users/[id] - Update a RADIUS user
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
    const userId = parseInt(resolvedParams.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      )
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

    // Check if user exists
    const existingUser = await prisma.radCheck.findUnique({
      where: { id: userId }
    })

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

// DELETE /api/radius/users/[id] - Delete a RADIUS user
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
    const userId = parseInt(resolvedParams.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.radCheck.findUnique({
      where: { id: userId }
    })

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
