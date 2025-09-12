import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// POST /api/radius/users/assign-group - Assign user to group
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { username, groupName, priority = 1 } = body

    // Validate required fields
    if (!username || !groupName) {
      return NextResponse.json(
        { error: "Username and group name are required" },
        { status: 400 }
      )
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

    // Check if assignment already exists
    const existingAssignment = await prisma.radUserGroup.findFirst({
      where: {
        username: username,
        groupname: groupName
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: "User is already assigned to this group" },
        { status: 409 }
      )
    }

    // Create user-group assignment
    const assignment = await prisma.radUserGroup.create({
      data: {
        username: username,
        groupname: groupName,
        priority: priority
      }
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error("Error assigning user to group:", error)
    return NextResponse.json(
      { error: "Failed to assign user to group" },
      { status: 500 }
    )
  }
}
