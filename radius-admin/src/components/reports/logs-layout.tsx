"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Server, Monitor, HardDrive, BarChart3, Activity } from "lucide-react"
import DaloRADIUSLogReport from "./daloradius-log"
import RADIUSServerLogReport from "./radius-server-log"
import SystemLogReport from "./system-log"
import BootLogReport from "./boot-log"

type LogTabType = "daloradius-log" | "radius-server-log" | "system-log" | "boot-log"

export default function LogsLayout() {
  const [activeTab, setActiveTab] = useState<LogTabType>("daloradius-log")

  const logTabs = [
    {
      id: "daloradius-log" as LogTabType,
      label: "daloRADIUS Log",
      icon: FileText,
      description: "Track all actions performed within the RazoRADIUS interface"
    },
    {
      id: "radius-server-log" as LogTabType,
      label: "RADIUS Server Log",
      icon: Server,
      description: "Monitor FreeRADIUS server logfile for authentication events"
    },
    {
      id: "system-log" as LogTabType,
      label: "System Log",
      icon: Monitor,
      description: "Monitor system logs including syslog and messages"
    },
    {
      id: "boot-log" as LogTabType,
      label: "Boot Log",
      icon: HardDrive,
      description: "Monitor boot and kernel messages from system startup"
    }
  ]

  const renderLogContent = () => {
    switch (activeTab) {
      case "daloradius-log":
        return <DaloRADIUSLogReport />
      case "radius-server-log":
        return <RADIUSServerLogReport />
      case "system-log":
        return <SystemLogReport />
      case "boot-log":
        return <BootLogReport />
      default:
        return <DaloRADIUSLogReport />
    }
  }

  return (
    <div className="space-y-6">
      {/* Logs Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Logs & Monitoring
          </CardTitle>
          <CardDescription>
            Comprehensive log monitoring and analysis for your RADIUS infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {logTabs.map((tab) => {
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

      {/* Log Content */}
      <div className="min-h-[600px]">
        {renderLogContent()}
      </div>
    </div>
  )
}
