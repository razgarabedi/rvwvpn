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

    // In a real application, this would send the invoice via email
    // For now, we'll just return a success response
    const result = {
      id: parseInt(id),
      status: "sent",
      sent_at: new Date().toISOString(),
      message: "Invoice sent successfully"
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error sending invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
