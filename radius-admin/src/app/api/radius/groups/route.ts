import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/groups - Fetch all RADIUS groups
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get unique group names from radgroupcheck table
    const groups = await prisma.radGroupCheck.findMany({
      select: {
        GroupName: true
      },
      distinct: ['GroupName'],
      orderBy: {
        GroupName: 'asc'
      }
    })

    // Get group check attributes
    const groupChecks = await prisma.radGroupCheck.findMany({
      orderBy: {
        GroupName: 'asc'
      }
    })

    // Get group reply attributes
    const groupReplies = await prisma.radGroupReply.findMany({
      orderBy: {
        GroupName: 'asc'
      }
    })

    // Combine data
    const groupData = groups.map(group => ({
      name: group.GroupName,
      checks: groupChecks.filter(check => check.GroupName === group.GroupName),
      replies: groupReplies.filter(reply => reply.GroupName === group.GroupName)
    }))

    return NextResponse.json(groupData)
  } catch (error) {
    console.error("Error fetching RADIUS groups:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    )
  }
}

// POST /api/radius/groups - Create a new RADIUS group
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { groupName, checks = [], replies = [] } = body

    // Validate required fields
    if (!groupName) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      )
    }

    // Check if group already exists
    const existingGroup = await prisma.radGroupCheck.findFirst({
      where: {
        GroupName: groupName
      }
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: "Group already exists" },
        { status: 409 }
      )
    }

    // Create group check attributes
    for (const check of checks) {
      await prisma.radGroupCheck.create({
        data: {
          GroupName: groupName,
          Attribute: check.attribute,
          op: check.op || "==",
          Value: check.value
        }
      })
    }

    // Create group reply attributes
    for (const reply of replies) {
      await prisma.radGroupReply.create({
        data: {
          GroupName: groupName,
          Attribute: reply.attribute,
          op: reply.op || "=",
          Value: reply.value
        }
      })
    }

    return NextResponse.json({ message: "Group created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Error creating RADIUS group:", error)
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    )
  }
}
