"use client"

import { Card } from "@/components/ui/card"
import { BarChart3, FileText, Download } from "lucide-react"

export default function ReportsTab() {
  const reportSections = [
    {
      title: "User Activity Reports",
      description: "Track user login attempts, session duration, and usage patterns",
      icon: BarChart3,
      status: "Coming Soon"
    },
    {
      title: "Authentication Logs",
      description: "View detailed authentication logs and failed login attempts",
      icon: FileText,
      status: "Coming Soon"
    },
    {
      title: "System Performance",
      description: "Monitor RADIUS server performance and response times",
      icon: BarChart3,
      status: "Coming Soon"
    },
    {
      title: "Export Reports",
      description: "Export reports in various formats (PDF, CSV, Excel)",
      icon: Download,
      status: "Coming Soon"
    }
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Generate and view comprehensive reports about your RADIUS system performance and user activity.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportSections.map((section, index) => {
          const Icon = section.icon
          return (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
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
