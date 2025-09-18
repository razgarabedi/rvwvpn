import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for invoices (in a real app, this would be in a database)
const mockInvoices = [
  {
    id: 1,
    invoice_number: "INV-2024-001",
    customer_id: 1,
    customer_name: "John Doe",
    customer_email: "john.doe@example.com",
    customer_address: "123 Main St, City, State 12345",
    status: "paid",
    subtotal: 45.50,
    tax_amount: 3.64,
    total_amount: 49.14,
    currency: "USD",
    due_date: "2024-02-15",
    issue_date: "2024-01-15",
    paid_date: "2024-01-15",
    payment_terms: "Net 30",
    notes: "Thank you for your business!",
    items: [
      {
        id: 1,
        description: "Internet Plan - Basic Monthly",
        quantity: 1,
        unit_price: 45.50,
        total_price: 45.50
      }
    ],
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    invoice_number: "INV-2024-002",
    customer_id: 2,
    customer_name: "Jane Smith",
    customer_email: "jane.smith@example.com",
    customer_address: "456 Oak Ave, City, State 12345",
    status: "sent",
    subtotal: 89.99,
    tax_amount: 7.20,
    total_amount: 97.19,
    currency: "USD",
    due_date: "2024-02-15",
    issue_date: "2024-01-15",
    payment_terms: "Net 30",
    notes: "Premium plan includes priority support",
    items: [
      {
        id: 2,
        description: "Internet Plan - Premium Monthly",
        quantity: 1,
        unit_price: 89.99,
        total_price: 89.99
      }
    ],
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T09:15:00Z"
  },
  {
    id: 3,
    invoice_number: "INV-2024-003",
    customer_id: 3,
    customer_name: "Bob Johnson",
    customer_email: "bob.johnson@example.com",
    customer_address: "789 Pine St, City, State 12345",
    status: "overdue",
    subtotal: 25.00,
    tax_amount: 2.00,
    total_amount: 27.00,
    currency: "USD",
    due_date: "2024-01-10",
    issue_date: "2024-01-01",
    payment_terms: "Net 30",
    notes: "Payment is overdue",
    items: [
      {
        id: 3,
        description: "Internet Plan - Basic Monthly",
        quantity: 1,
        unit_price: 25.00,
        total_price: 25.00
      }
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
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
    const invoice = mockInvoices.find(i => i.id === parseInt(id))

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
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
      customer_address, 
      due_date, 
      payment_terms, 
      notes, 
      items 
    } = body

    const invoiceIndex = mockInvoices.findIndex(i => i.id === parseInt(id))
    if (invoiceIndex === -1) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (!customer_name || !customer_email || !items || items.length === 0) {
      return NextResponse.json({ error: "Customer information and items are required" }, { status: 400 })
    }

    const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = subtotal * 0.08 // 8% tax
    const total_amount = subtotal + tax_amount

    mockInvoices[invoiceIndex] = {
      ...mockInvoices[invoiceIndex],
      customer_name,
      customer_email,
      customer_address: customer_address || mockInvoices[invoiceIndex].customer_address,
      due_date: due_date || mockInvoices[invoiceIndex].due_date,
      payment_terms: payment_terms || mockInvoices[invoiceIndex].payment_terms,
      notes: notes || mockInvoices[invoiceIndex].notes,
      subtotal,
      tax_amount,
      total_amount,
      items: items.map((item: { description: string; quantity: number; unit_price: number }, index: number) => ({
        id: index + 1,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      })),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockInvoices[invoiceIndex])
  } catch (error) {
    console.error("Error updating invoice:", error)
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
    const invoiceIndex = mockInvoices.findIndex(i => i.id === parseInt(id))

    if (invoiceIndex === -1) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    mockInvoices.splice(invoiceIndex, 1)

    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
