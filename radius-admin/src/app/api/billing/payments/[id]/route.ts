import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for payments (in a real app, this would be in a database)
const mockPayments = [
  {
    id: 1,
    payment_number: "PAY-2024-001",
    customer_id: 1,
    customer_name: "John Doe",
    customer_email: "john.doe@example.com",
    invoice_id: 1,
    invoice_number: "INV-2024-001",
    amount: 45.50,
    currency: "USD",
    payment_method: "paypal",
    payment_status: "completed",
    transaction_id: "TXN001234",
    reference_number: "REF001234",
    notes: "Monthly subscription payment",
    payment_date: "2024-01-15",
    processed_date: "2024-01-15T10:30:00Z",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    metadata: { source: "paypal", fee: 1.36, refund_reason: "", refund_id: "", error: "", bank: "" }
  },
  {
    id: 2,
    payment_number: "PAY-2024-002",
    customer_id: 2,
    customer_name: "Jane Smith",
    customer_email: "jane.smith@example.com",
    invoice_id: 2,
    invoice_number: "INV-2024-002",
    amount: 89.99,
    currency: "USD",
    payment_method: "credit_card",
    payment_status: "completed",
    transaction_id: "TXN001235",
    reference_number: "REF001235",
    notes: "Premium plan payment",
    payment_date: "2024-01-15",
    processed_date: "2024-01-15T09:15:00Z",
    created_at: "2024-01-15T09:15:00Z",
    updated_at: "2024-01-15T09:15:00Z",
    metadata: { source: "stripe", fee: 2.70, refund_reason: "", refund_id: "", error: "", bank: "" }
  },
  {
    id: 3,
    payment_number: "PAY-2024-003",
    customer_id: 3,
    customer_name: "Bob Johnson",
    customer_email: "bob.johnson@example.com",
    invoice_id: 3,
    invoice_number: "INV-2024-003",
    amount: 25.00,
    currency: "USD",
    payment_method: "cash",
    payment_status: "pending",
    transaction_id: "TXN001236",
    reference_number: "REF001236",
    notes: "Cash payment at office",
    payment_date: "2024-01-15",
    processed_date: "",
    created_at: "2024-01-15T08:45:00Z",
    updated_at: "2024-01-15T08:45:00Z",
    metadata: { location: "office", cashier: "admin", refund_reason: "", refund_id: "", error: "", bank: "" }
  },
  {
    id: 4,
    payment_number: "PAY-2024-004",
    customer_id: 4,
    customer_name: "Alice Brown",
    customer_email: "alice.brown@example.com",
    invoice_id: 4,
    invoice_number: "INV-2024-004",
    amount: 120.00,
    currency: "USD",
    payment_method: "bank_transfer",
    payment_status: "failed",
    transaction_id: "TXN001237",
    reference_number: "REF001237",
    notes: "Bank transfer failed - insufficient funds",
    payment_date: "2024-01-15",
    created_at: "2024-01-15T07:20:00Z",
    updated_at: "2024-01-15T07:20:00Z",
    metadata: { error: "insufficient_funds", bank: "chase", refund_reason: "", refund_id: "", source: "", fee: 0 }
  },
  {
    id: 5,
    payment_number: "PAY-2024-005",
    customer_id: 5,
    customer_name: "Charlie Wilson",
    customer_email: "charlie.wilson@example.com",
    invoice_id: 5,
    invoice_number: "INV-2024-005",
    amount: 65.75,
    currency: "USD",
    payment_method: "check",
    payment_status: "refunded",
    transaction_id: "TXN001238",
    reference_number: "REF001238",
    notes: "Check payment - refunded due to service cancellation",
    payment_date: "2024-01-14",
    processed_date: "2024-01-14T16:45:00Z",
    created_at: "2024-01-14T16:45:00Z",
    updated_at: "2024-01-14T18:30:00Z",
    metadata: { refund_reason: "service_cancellation", refund_id: "REF123456", source: "", fee: 0, error: "", bank: "" }
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const payment = mockPayments.find(p => p.id === parseInt(id))

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      customer_name, 
      customer_email, 
      amount, 
      currency, 
      payment_method, 
      payment_status, 
      transaction_id, 
      reference_number, 
      notes, 
      payment_date
    } = body

    const paymentIndex = mockPayments.findIndex(p => p.id === parseInt(id))
    if (paymentIndex === -1) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (!customer_name || !customer_email || !amount) {
      return NextResponse.json({ error: "Customer information and amount are required" }, { status: 400 })
    }

    mockPayments[paymentIndex] = {
      ...mockPayments[paymentIndex],
      customer_name,
      customer_email,
      amount: parseFloat(amount),
      currency: currency || mockPayments[paymentIndex].currency,
      payment_method: payment_method || mockPayments[paymentIndex].payment_method,
      payment_status: payment_status || mockPayments[paymentIndex].payment_status,
      transaction_id: transaction_id || mockPayments[paymentIndex].transaction_id,
      reference_number: reference_number || mockPayments[paymentIndex].reference_number,
      notes: notes || mockPayments[paymentIndex].notes,
      payment_date: payment_date || mockPayments[paymentIndex].payment_date,
      processed_date: payment_status === "completed" ? new Date().toISOString() : (mockPayments[paymentIndex].processed_date || ""),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockPayments[paymentIndex])
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const paymentIndex = mockPayments.findIndex(p => p.id === parseInt(id))

    if (paymentIndex === -1) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    mockPayments.splice(paymentIndex, 1)

    return NextResponse.json({ message: "Payment deleted successfully" })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
