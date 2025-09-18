import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for plans (in a real app, this would be in a database)
const mockPlans = [
  {
    id: 1,
    name: "Basic Plan",
    description: "Basic internet access with standard speed",
    price: 29.99,
    billing_cycle: "monthly",
    duration_days: 30,
    data_limit: 100,
    speed_limit: 25,
    concurrent_sessions: 1,
    status: "active",
    features: ["24/7 Support", "Basic Speed", "100GB Data"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    name: "Premium Plan",
    description: "High-speed internet with premium features",
    price: 59.99,
    billing_cycle: "monthly",
    duration_days: 30,
    data_limit: 500,
    speed_limit: 100,
    concurrent_sessions: 3,
    status: "active",
    features: ["24/7 Support", "High Speed", "500GB Data", "Priority Support"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 3,
    name: "Business Plan",
    description: "Enterprise-grade internet for businesses",
    price: 149.99,
    billing_cycle: "monthly",
    duration_days: 30,
    data_limit: -1,
    speed_limit: 1000,
    concurrent_sessions: 10,
    status: "active",
    features: ["24/7 Support", "Ultra High Speed", "Unlimited Data", "Static IP", "SLA Guarantee"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 4,
    name: "Annual Basic",
    description: "Basic plan with annual billing discount",
    price: 299.99,
    billing_cycle: "yearly",
    duration_days: 365,
    data_limit: 1200,
    speed_limit: 25,
    concurrent_sessions: 1,
    status: "active",
    features: ["24/7 Support", "Basic Speed", "1200GB Data", "Annual Discount"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
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
    const plan = mockPlans.find(p => p.id === parseInt(id))

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error fetching plan:", error)
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
      name, 
      description, 
      price, 
      billing_cycle, 
      duration_days, 
      data_limit, 
      speed_limit, 
      concurrent_sessions, 
      status, 
      features 
    } = body

    const planIndex = mockPlans.findIndex(p => p.id === parseInt(id))
    if (planIndex === -1) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    if (!name || !description || price === undefined) {
      return NextResponse.json({ error: "Name, description, and price are required" }, { status: 400 })
    }

    mockPlans[planIndex] = {
      ...mockPlans[planIndex],
      name,
      description,
      price: parseFloat(price),
      billing_cycle: billing_cycle || mockPlans[planIndex].billing_cycle,
      duration_days: parseInt(duration_days) || mockPlans[planIndex].duration_days,
      data_limit: parseInt(data_limit) || mockPlans[planIndex].data_limit,
      speed_limit: parseInt(speed_limit) || mockPlans[planIndex].speed_limit,
      concurrent_sessions: parseInt(concurrent_sessions) || mockPlans[planIndex].concurrent_sessions,
      status: status || mockPlans[planIndex].status,
      features: features || mockPlans[planIndex].features,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockPlans[planIndex])
  } catch (error) {
    console.error("Error updating plan:", error)
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
    const planIndex = mockPlans.findIndex(p => p.id === parseInt(id))

    if (planIndex === -1) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    mockPlans.splice(planIndex, 1)

    return NextResponse.json({ message: "Plan deleted successfully" })
  } catch (error) {
    console.error("Error deleting plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
