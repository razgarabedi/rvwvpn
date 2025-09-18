import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for billing history
const mockBillingHistory = [
  {
    id: 1,
    customer_id: 1,
    customer_name: "John Doe",
    customer_email: "john.doe@example.com",
    transaction_type: "payment",
    amount: 45.50,
    currency: "USD",
    status: "completed",
    payment_method: "paypal",
    description: "Monthly subscription payment",
    reference_id: "TXN001234",
    invoice_id: "INV-001",
    plan_id: 1,
    plan_name: "Basic Plan",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    metadata: { source: "paypal", fee: 1.36 }
  },
  {
    id: 2,
    customer_id: 2,
    customer_name: "Jane Smith",
    customer_email: "jane.smith@example.com",
    transaction_type: "payment",
    amount: 89.99,
    currency: "USD",
    status: "completed",
    payment_method: "credit_card",
    description: "Monthly subscription payment",
    reference_id: "TXN001235",
    invoice_id: "INV-002",
    plan_id: 2,
    plan_name: "Premium Plan",
    created_at: "2024-01-15T09:15:00Z",
    updated_at: "2024-01-15T09:15:00Z",
    metadata: { source: "stripe", fee: 2.70 }
  },
  {
    id: 3,
    customer_id: 3,
    customer_name: "Bob Johnson",
    customer_email: "bob.johnson@example.com",
    transaction_type: "refund",
    amount: 25.00,
    currency: "USD",
    status: "completed",
    payment_method: "paypal",
    description: "Refund for cancelled service",
    reference_id: "REF001001",
    invoice_id: "INV-003",
    plan_id: 1,
    plan_name: "Basic Plan",
    created_at: "2024-01-14T16:45:00Z",
    updated_at: "2024-01-14T16:45:00Z",
    metadata: { reason: "Service cancellation", refund_id: "REF123456" }
  },
  {
    id: 4,
    customer_id: 4,
    customer_name: "Alice Brown",
    customer_email: "alice.brown@example.com",
    transaction_type: "adjustment",
    amount: -10.00,
    currency: "USD",
    status: "completed",
    payment_method: "other",
    description: "Service credit adjustment",
    reference_id: "ADJ001001",
    invoice_id: "INV-004",
    created_at: "2024-01-14T14:20:00Z",
    updated_at: "2024-01-14T14:20:00Z",
    metadata: { reason: "Service outage credit", admin: "admin@example.com" }
  },
  {
    id: 5,
    customer_id: 5,
    customer_name: "Charlie Wilson",
    customer_email: "charlie.wilson@example.com",
    transaction_type: "subscription",
    amount: 149.99,
    currency: "USD",
    status: "completed",
    payment_method: "bank_transfer",
    description: "Annual subscription renewal",
    reference_id: "SUB001001",
    invoice_id: "INV-005",
    plan_id: 3,
    plan_name: "Business Plan",
    created_at: "2024-01-13T11:30:00Z",
    updated_at: "2024-01-13T11:30:00Z",
    metadata: { renewal: true, discount: 0.1 }
  }
]

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(mockBillingHistory)
  } catch (error) {
    console.error("Error fetching billing history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
