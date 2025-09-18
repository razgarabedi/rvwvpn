import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/users/search - Search for users
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "username"
    const term = searchParams.get("term") || ""
    const attribute = searchParams.get("attribute") || ""

    if (!term.trim()) {
      return NextResponse.json([])
    }

    // Mock data for demonstration - in production, this would query the actual database
    const mockUsers = [
      {
        id: 1,
        username: "john.doe",
        value: "password123",
        op: ":=",
        attribute: "Cleartext-Password",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 2,
        username: "jane.smith",
        value: "securepass456",
        op: ":=",
        attribute: "Cleartext-Password",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 3,
        username: "admin",
        value: "adminpass789",
        op: ":=",
        attribute: "Cleartext-Password",
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 4,
        username: "john.doe",
        value: "office-users",
        op: ":=",
        attribute: "User-Group",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 5,
        username: "jane.smith",
        value: "guest-users",
        op: ":=",
        attribute: "User-Group",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 6,
        username: "admin",
        value: "admin-users",
        op: ":=",
        attribute: "User-Group",
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 259200000).toISOString()
      }
    ]

    // Filter based on search criteria
    let filteredUsers = mockUsers

    if (type === "username") {
      filteredUsers = filteredUsers.filter(user =>
        user.username.toLowerCase().includes(term.toLowerCase())
      )
    } else if (type === "attribute") {
      filteredUsers = filteredUsers.filter(user =>
        user.attribute.toLowerCase().includes(term.toLowerCase()) ||
        user.value.toLowerCase().includes(term.toLowerCase())
      )
    } else if (type === "group") {
      filteredUsers = filteredUsers.filter(user =>
        user.attribute === "User-Group" &&
        user.value.toLowerCase().includes(term.toLowerCase())
      )
    }

    // Apply attribute filter if specified
    if (attribute) {
      filteredUsers = filteredUsers.filter(user => user.value === attribute)
    }

    return NextResponse.json(filteredUsers)
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    )
  }
}
