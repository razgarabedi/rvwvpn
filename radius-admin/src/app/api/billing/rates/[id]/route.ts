import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for rates (in a real app, this would be in a database)
const mockRates = [
  {
    id: 1,
    name: "Standard Hourly Rate",
    description: "Standard rate for hourly internet access",
    rate_type: "per_hour",
    base_rate: 2.50,
    currency: "USD",
    minimum_charge: 5.00,
    maximum_charge: 50.00,
    data_included: 5,
    time_included: 1,
    overage_rate: 0.50,
    discount_percentage: 10,
    discount_threshold: 20.00,
    status: "active",
    applicable_plans: [1, 2],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    name: "Daily Access Rate",
    description: "Daily rate for internet access",
    rate_type: "per_day",
    base_rate: 15.00,
    currency: "USD",
    minimum_charge: 10.00,
    maximum_charge: 100.00,
    data_included: 50,
    time_included: 24,
    overage_rate: 1.00,
    discount_percentage: 15,
    discount_threshold: 50.00,
    status: "active",
    applicable_plans: [1, 2, 3],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 3,
    name: "Monthly Flat Rate",
    description: "Flat monthly rate for unlimited access",
    rate_type: "flat_rate",
    base_rate: 29.99,
    currency: "USD",
    minimum_charge: 29.99,
    maximum_charge: 29.99,
    data_included: -1,
    time_included: -1,
    overage_rate: 0,
    discount_percentage: 0,
    discount_threshold: 0,
    status: "active",
    applicable_plans: [1],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 4,
    name: "Data Overage Rate",
    description: "Rate for data usage beyond plan limits",
    rate_type: "per_gb",
    base_rate: 0.10,
    currency: "USD",
    minimum_charge: 0,
    maximum_charge: 0,
    data_included: 0,
    time_included: 0,
    overage_rate: 0.10,
    discount_percentage: 0,
    discount_threshold: 0,
    status: "active",
    applicable_plans: [1, 2, 3],
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
    const rate = mockRates.find(r => r.id === parseInt(id))

    if (!rate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json(rate)
  } catch (error) {
    console.error("Error fetching rate:", error)
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
      rate_type, 
      base_rate, 
      currency, 
      minimum_charge, 
      maximum_charge, 
      data_included, 
      time_included, 
      overage_rate, 
      discount_percentage, 
      discount_threshold, 
      status, 
      applicable_plans 
    } = body

    const rateIndex = mockRates.findIndex(r => r.id === parseInt(id))
    if (rateIndex === -1) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 })
    }

    if (!name || !description || base_rate === undefined) {
      return NextResponse.json({ error: "Name, description, and base_rate are required" }, { status: 400 })
    }

    mockRates[rateIndex] = {
      ...mockRates[rateIndex],
      name,
      description,
      rate_type: rate_type || mockRates[rateIndex].rate_type,
      base_rate: parseFloat(base_rate),
      currency: currency || mockRates[rateIndex].currency,
      minimum_charge: parseFloat(minimum_charge) || mockRates[rateIndex].minimum_charge,
      maximum_charge: parseFloat(maximum_charge) || mockRates[rateIndex].maximum_charge,
      data_included: parseInt(data_included) || mockRates[rateIndex].data_included,
      time_included: parseInt(time_included) || mockRates[rateIndex].time_included,
      overage_rate: parseFloat(overage_rate) || mockRates[rateIndex].overage_rate,
      discount_percentage: parseFloat(discount_percentage) || mockRates[rateIndex].discount_percentage,
      discount_threshold: parseFloat(discount_threshold) || mockRates[rateIndex].discount_threshold,
      status: status || mockRates[rateIndex].status,
      applicable_plans: applicable_plans || mockRates[rateIndex].applicable_plans,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockRates[rateIndex])
  } catch (error) {
    console.error("Error updating rate:", error)
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
    const rateIndex = mockRates.findIndex(r => r.id === parseInt(id))

    if (rateIndex === -1) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 })
    }

    mockRates.splice(rateIndex, 1)

    return NextResponse.json({ message: "Rate deleted successfully" })
  } catch (error) {
    console.error("Error deleting rate:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
