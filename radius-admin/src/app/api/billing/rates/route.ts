import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// Mock data for rates
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

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(mockRates)
  } catch (error) {
    console.error("Error fetching rates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    if (!name || !description || base_rate === undefined) {
      return NextResponse.json({ error: "Name, description, and base_rate are required" }, { status: 400 })
    }

    const newRate = {
      id: mockRates.length + 1,
      name,
      description,
      rate_type: rate_type || "per_hour",
      base_rate: parseFloat(base_rate),
      currency: currency || "USD",
      minimum_charge: parseFloat(minimum_charge) || 0,
      maximum_charge: parseFloat(maximum_charge) || 0,
      data_included: parseInt(data_included) || -1,
      time_included: parseInt(time_included) || -1,
      overage_rate: parseFloat(overage_rate) || 0,
      discount_percentage: parseFloat(discount_percentage) || 0,
      discount_threshold: parseFloat(discount_threshold) || 0,
      status: status || "active",
      applicable_plans: applicable_plans || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockRates.push(newRate)

    return NextResponse.json(newRate, { status: 201 })
  } catch (error) {
    console.error("Error creating rate:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
