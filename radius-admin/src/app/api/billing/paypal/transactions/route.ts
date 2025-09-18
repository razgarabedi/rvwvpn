import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for PayPal transactions
const mockPayPalTransactions = [
  {
    id: 1,
    transaction_id: "TXN001234",
    paypal_transaction_id: "PP-1234567890",
    customer_email: "john.doe@example.com",
    customer_name: "John Doe",
    amount: 45.50,
    currency: "USD",
    status: "completed",
    payment_method: "paypal",
    description: "Internet Plan - Basic Monthly",
    invoice_id: "INV-001",
    plan_id: 1,
    plan_name: "Basic Plan",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    paypal_fee: 1.36,
    net_amount: 44.14
  },
  {
    id: 2,
    transaction_id: "TXN001235",
    paypal_transaction_id: "PP-1234567891",
    customer_email: "jane.smith@example.com",
    customer_name: "Jane Smith",
    amount: 89.99,
    currency: "USD",
    status: "completed",
    payment_method: "paypal",
    description: "Internet Plan - Premium Monthly",
    invoice_id: "INV-002",
    plan_id: 2,
    plan_name: "Premium Plan",
    created_at: "2024-01-15T09:15:00Z",
    updated_at: "2024-01-15T09:15:00Z",
    paypal_fee: 2.70,
    net_amount: 87.29
  },
  {
    id: 3,
    transaction_id: "TXN001236",
    paypal_transaction_id: "PP-1234567892",
    customer_email: "bob.johnson@example.com",
    customer_name: "Bob Johnson",
    amount: 25.00,
    currency: "USD",
    status: "pending",
    payment_method: "paypal",
    description: "Internet Plan - Basic Monthly",
    invoice_id: "INV-003",
    plan_id: 1,
    plan_name: "Basic Plan",
    created_at: "2024-01-15T08:45:00Z",
    updated_at: "2024-01-15T08:45:00Z",
    paypal_fee: 0.75,
    net_amount: 24.25
  },
  {
    id: 4,
    transaction_id: "TXN001237",
    paypal_transaction_id: "PP-1234567893",
    customer_email: "alice.brown@example.com",
    customer_name: "Alice Brown",
    amount: 120.00,
    currency: "USD",
    status: "failed",
    payment_method: "paypal",
    description: "Internet Plan - Business Monthly",
    invoice_id: "INV-004",
    plan_id: 3,
    plan_name: "Business Plan",
    created_at: "2024-01-15T07:20:00Z",
    updated_at: "2024-01-15T07:20:00Z",
    paypal_fee: 0,
    net_amount: 0
  },
  {
    id: 5,
    transaction_id: "TXN001238",
    paypal_transaction_id: "PP-1234567894",
    customer_email: "charlie.wilson@example.com",
    customer_name: "Charlie Wilson",
    amount: 65.75,
    currency: "USD",
    status: "refunded",
    payment_method: "paypal",
    description: "Internet Plan - Standard Monthly",
    invoice_id: "INV-005",
    plan_id: 2,
    plan_name: "Premium Plan",
    created_at: "2024-01-14T16:45:00Z",
    updated_at: "2024-01-14T18:30:00Z",
    paypal_fee: 1.97,
    net_amount: 63.78,
    refund_amount: 65.75,
    refund_reason: "Customer request"
  }
]

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(mockPayPalTransactions)
  } catch (error) {
    console.error("Error fetching PayPal transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
