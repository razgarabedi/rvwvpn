import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for POS transactions
const mockTransactions = [
  {
    id: 1,
    pos_device_id: 1,
    customer_name: "John Doe",
    amount: 45.50,
    payment_method: "card",
    status: "completed",
    items: ["Internet Plan - Basic", "Setup Fee"],
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    pos_device_id: 1,
    customer_name: "Jane Smith",
    amount: 89.99,
    payment_method: "cash",
    status: "completed",
    items: ["Internet Plan - Premium", "Router Rental"],
    created_at: "2024-01-15T09:15:00Z"
  },
  {
    id: 3,
    pos_device_id: 2,
    customer_name: "Bob Johnson",
    amount: 25.00,
    payment_method: "paypal",
    status: "completed",
    items: ["Internet Plan - Basic"],
    created_at: "2024-01-15T08:45:00Z"
  },
  {
    id: 4,
    pos_device_id: 1,
    customer_name: "Alice Brown",
    amount: 120.00,
    payment_method: "card",
    status: "pending",
    items: ["Internet Plan - Business", "Static IP"],
    created_at: "2024-01-15T07:20:00Z"
  },
  {
    id: 5,
    pos_device_id: 3,
    customer_name: "Charlie Wilson",
    amount: 65.75,
    payment_method: "other",
    status: "failed",
    items: ["Internet Plan - Standard"],
    created_at: "2024-01-14T16:45:00Z"
  }
]

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(mockTransactions)
  } catch (error) {
    console.error("Error fetching POS transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
