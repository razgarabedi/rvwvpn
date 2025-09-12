import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// POST /api/radius/users/reply-attributes - Add user reply attributes
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { username, attributes } = body

    // Validate required fields
    if (!username || !attributes || !Array.isArray(attributes)) {
      return NextResponse.json(
        { error: "Username and attributes array are required" },
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

    // Create user reply attributes
    const createdAttributes = []
    for (const attr of attributes) {
      if (!attr.attribute || !attr.value) {
        continue // Skip invalid attributes
      }

      const replyAttribute = await prisma.radReply.create({
        data: {
          username: username,
          attribute: attr.attribute,
          op: attr.op || "=",
          value: attr.value
        }
      })

      createdAttributes.push(replyAttribute)
    }

    return NextResponse.json(createdAttributes, { status: 201 })
  } catch (error) {
    console.error("Error adding user reply attributes:", error)
    return NextResponse.json(
      { error: "Failed to add user reply attributes" },
      { status: 500 }
    )
  }
}
