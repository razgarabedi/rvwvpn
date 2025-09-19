import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// Helper function to determine if param is an ID or username
function isNumericId(param: string): boolean {
  return !isNaN(parseInt(param)) && isFinite(parseInt(param))
}

// GET /api/radius/users/[param]/groups - Fetch user's group assignments
export async function GET(
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

    let username

    if (isNumericId(param)) {
      // Handle by ID - first get the user to find username
      const userId = parseInt(param)
      const user = await prisma.radCheck.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
      
      username = user.username
    } else {
      // Handle by username
      username = decodeURIComponent(param)
    }

    // Fetch user's group assignments
    const userGroups = await prisma.radUserGroup.findMany({
      where: {
        username: username
      },
      orderBy: {
        priority: 'asc'
      }
    })
    return NextResponse.json(userGroups)
  } catch (error) {
    console.error("Error fetching user groups:", error)
    return NextResponse.json(
      { error: "Failed to fetch user groups" },
      { status: 500 }
    )
  }
}

// PUT /api/radius/users/[param]/groups - Update user's group assignments
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
    const { groupName } = body

    // Validate required fields
    if (!groupName) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      )
    }

    let username

    if (isNumericId(param)) {
      // Handle by ID - first get the user to find username
      const userId = parseInt(param)
      const user = await prisma.radCheck.findFirst({
        where: {
          id: userId,
          attribute: "Cleartext-Password"
        }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
      
      username = user.username
    } else {
      // Handle by username
      username = decodeURIComponent(param)
    }

    // Check if user exists
    const userExists = await prisma.radCheck.findFirst({
      where: {
        username: username,
        attribute: "Cleartext-Password"
      }
    })

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if group exists
    const groupExists = await prisma.radGroupCheck.findFirst({
      where: {
        groupname: groupName
      }
    })

    if (!groupExists) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      )
    }

    // Use transaction to update group assignments
    await prisma.$transaction(async (tx) => {
      // Remove all existing group assignments for this user
      await tx.radUserGroup.deleteMany({
        where: {
          username: username
        }
      })

      // Add new group assignment if group name is not empty
      if (groupName.trim() !== "") {
        await tx.radUserGroup.create({
          data: {
            username: username,
            groupname: groupName,
            priority: 1
          }
        })
      }
    })

    return NextResponse.json({ message: "User group updated successfully" })
  } catch (error) {
    console.error("Error updating user group:", error)
    return NextResponse.json(
      { error: "Failed to update user group" },
      { status: 500 }
    )
  }
}
