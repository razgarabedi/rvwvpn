"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Activity, Search, Trophy, BarChart3, TrendingUp, FileText, Server } from "lucide-react"
import OnlineUsersReport from "./online-users"
import ConnectionAttemptsReport from "./connection-attempts"
import SearchUsersReport from "./search-users"
import TopUsersReport from "./top-users"
import LogsLayout from "./logs-layout"
import StatusLayout from "./status-layout"

type ReportTabType = "online-users" | "connection-attempts" | "search-users" | "top-users" | "logs" | "status"

export default function ReportsLayout() {
  const [activeTab, setActiveTab] = useState<ReportTabType>("online-users")

  const reportTabs = [
    {
      id: "online-users" as ReportTabType,
      label: "Online Users",
      icon: Users,
      description: "Currently connected users across all NAS devices"
    },
    {
      id: "connection-attempts" as ReportTabType,
      label: "Connection Attempts",
      icon: Activity,
      description: "Recent authentication attempts and their status"
    },
    {
      id: "search-users" as ReportTabType,
      label: "Search Users",
      icon: Search,
      description: "Search for users using various criteria"
    },
    {
      id: "top-users" as ReportTabType,
      label: "Top Users",
      icon: Trophy,
      description: "Users ranked by bandwidth and time usage"
    },
    {
      id: "logs" as ReportTabType,
      label: "Logs & Monitoring",
      icon: FileText,
      description: "Comprehensive log monitoring and analysis"
    },
    {
      id: "status" as ReportTabType,
      label: "Status & Monitoring",
      icon: Server,
      description: "Real-time server and RADIUS service monitoring"
    }
  ]

  const renderReportContent = () => {
    switch (activeTab) {
      case "online-users":
        return <OnlineUsersReport />
      case "connection-attempts":
        return <ConnectionAttemptsReport />
      case "search-users":
        return <SearchUsersReport />
      case "top-users":
        return <TopUsersReport />
      case "logs":
        return <LogsLayout />
      case "status":
        return <StatusLayout />
      default:
        return <OnlineUsersReport />
    }
  }

  return (
    <div className="space-y-6">
      {/* Reports Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reports & Analytics
          </CardTitle>
          <CardDescription>
            Comprehensive reporting and analytics for your RADIUS infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTabs.map((tab) => {
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

      {/* Report Content */}
      <div className="min-h-[600px]">
        {renderReportContent()}
      </div>
    </div>
  )
}
