"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, Activity, Users, Wifi, Clock } from "lucide-react"

export default function GraphsTab() {
  const graphSections = [
    {
      title: "User Activity Trends",
      description: "Visualize user login patterns and peak usage times",
      icon: TrendingUp,
      status: "Coming Soon"
    },
    {
      title: "Real-time Monitoring",
      description: "Live dashboard showing current system activity and connections",
      icon: Activity,
      status: "Coming Soon"
    },
    {
      title: "User Distribution",
      description: "Charts showing user distribution across groups and locations",
      icon: Users,
      status: "Coming Soon"
    },
    {
      title: "Network Performance",
      description: "Graphs showing network latency, throughput, and error rates",
      icon: Wifi,
      status: "Coming Soon"
    },
    {
      title: "Session Duration",
      description: "Analyze average session durations and connection patterns",
      icon: Clock,
      status: "Coming Soon"
    },
    {
      title: "Authentication Success Rate",
      description: "Track authentication success/failure rates over time",
      icon: TrendingUp,
      status: "Coming Soon"
    }
  ]

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {graphSections.map((section, index) => {
          const Icon = section.icon
          return (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Icon className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {section.description}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {section.status}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
