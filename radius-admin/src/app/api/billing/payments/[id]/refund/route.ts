import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(
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
    const { amount, reason } = body

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 })
    }

    // In a real application, this would process the refund with the payment provider
    // For now, we'll just return a success response
    const result = {
      id: parseInt(id),
      refund_amount: parseFloat(amount),
      reason: reason || "Customer request",
      status: "refunded",
      refunded_at: new Date().toISOString(),
      message: "Payment refunded successfully"
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error refunding payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
