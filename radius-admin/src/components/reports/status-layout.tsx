"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Database, Activity } from "lucide-react"
import ServerStatusReport from "./server-status"
import RADIUSStatusReport from "./radius-status"

type StatusTabType = "server-status" | "radius-status"

interface StatusLayoutProps {
  activeTab?: StatusTabType
}

export default function StatusLayout({ activeTab: propActiveTab }: StatusLayoutProps) {
  const [activeTab, setActiveTab] = useState<StatusTabType>(propActiveTab || "server-status")

  // Update activeTab when prop changes
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab)
    }
  }, [propActiveTab])

  const statusTabs = [
    {
      id: "server-status" as StatusTabType,
      label: "Server Status",
      icon: Server,
      description: "Detailed server information including CPU, memory, disk, and network"
    },
    {
      id: "radius-status" as StatusTabType,
      label: "RADIUS Status",
      icon: Database,
      description: "FreeRADIUS server and database status monitoring"
    }
  ]

  const renderStatusContent = () => {
    switch (activeTab) {
      case "server-status":
        return <ServerStatusReport />
      case "radius-status":
        return <RADIUSStatusReport />
      default:
        return <ServerStatusReport />
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status & Monitoring
          </CardTitle>
          <CardDescription>
            Real-time monitoring of server resources and RADIUS services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statusTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <div
                  key={tab.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${
                      activeTab === tab.id ? "text-blue-600" : "text-gray-500"
                    }`} />
                    <div>
                      <h3 className={`font-medium ${
                        activeTab === tab.id ? "text-blue-900" : "text-gray-900"
                      }`}>
                        {tab.label}
                      </h3>
                      <p className={`text-sm ${
                        activeTab === tab.id ? "text-blue-700" : "text-gray-600"
                      }`}>
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status Content */}
      <div className="min-h-[600px]">
        {renderStatusContent()}
      </div>
    </div>
  )
}
