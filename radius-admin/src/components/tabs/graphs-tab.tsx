"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, Activity, Users, Wifi, Clock, BarChart3, PieChart } from "lucide-react"
import RealtimeMonitoring from "@/components/realtime-monitoring"

export default function GraphsTab() {
  const [activeChart, setActiveChart] = useState<string>("real-time")

  const chartTypes = [
    { id: "real-time", label: "Real-time Monitoring", icon: Activity, description: "Live dashboard showing current system activity and connections" },
    { id: "activity-trends", label: "Activity Trends", icon: TrendingUp, description: "User login patterns and peak usage times" },
    { id: "user-distribution", label: "User Distribution", icon: Users, description: "User distribution across groups and locations" },
    { id: "network-performance", label: "Network Performance", icon: Wifi, description: "Network latency, throughput, and error rates" },
    { id: "session-duration", label: "Session Duration", icon: Clock, description: "Average session durations and patterns" },
    { id: "auth-success", label: "Auth Success Rate", icon: BarChart3, description: "Authentication success/failure rates over time" }
  ]

  const renderChart = () => {
    switch (activeChart) {
      case "real-time":
        return <RealtimeMonitoring />
      case "activity-trends":
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Activity trends visualization coming soon...</p>
              </div>
            </div>
          </Card>
        )
      case "user-distribution":
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">User distribution charts coming soon...</p>
              </div>
            </div>
          </Card>
        )
      case "network-performance":
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Network Performance</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Network performance graphs coming soon...</p>
              </div>
            </div>
          </Card>
        )
      case "session-duration":
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Session Duration</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Session duration analysis coming soon...</p>
              </div>
            </div>
          </Card>
        )
      case "auth-success":
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Authentication Success Rate</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Auth success rate charts coming soon...</p>
              </div>
            </div>
          </Card>
        )
      default:
        return <RealtimeMonitoring />
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Graphs & Analytics</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Visualize your RADIUS system data with interactive graphs and real-time analytics.
        </p>
      </Card>

      {/* Chart Type Selector */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analytics Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chartTypes.map((chart) => {
            const Icon = chart.icon
            return (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  activeChart === chart.id
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-6 w-6 mt-1" />
                  <div>
                    <p className="font-medium">{chart.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{chart.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Chart Content */}
      {renderChart()}
    </div>
  )
}
