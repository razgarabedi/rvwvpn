"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  BarChart3, 
  TrendingUp, 
  Cog, 
  HelpCircle
} from "lucide-react"
import ManagementTab from "@/components/tabs/management-tab"
import ReportsTab from "@/components/tabs/reports-tab"
import GraphsTab from "@/components/tabs/graphs-tab"
import ConfigTab from "@/components/tabs/config-tab"
import HelpTab from "@/components/tabs/help-tab"

type MainTabType = "management" | "reports" | "graphs" | "config" | "help"

export default function Home() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<MainTabType>("management")

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: "management" as MainTabType,
      label: "Management",
      icon: Settings,
      description: "Users, Groups, NAS Devices & Server Config"
    },
    {
      id: "reports" as MainTabType,
      label: "Reports",
      icon: BarChart3,
      description: "System reports and analytics"
    },
    {
      id: "graphs" as MainTabType,
      label: "Graphs",
      icon: TrendingUp,
      description: "Visual data representations"
    },
    {
      id: "config" as MainTabType,
      label: "Config",
      icon: Cog,
      description: "System configuration settings"
    },
    {
      id: "help" as MainTabType,
      label: "Help",
      icon: HelpCircle,
      description: "Documentation and support"
    }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "management":
        return <ManagementTab />
      case "reports":
        return <ReportsTab />
      case "graphs":
        return <GraphsTab />
      case "config":
        return <ConfigTab />
      case "help":
        return <HelpTab />
      default:
        return <ManagementTab />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row - Title and User Info */}
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Radius Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Logged in as: {session?.user?.email}
              </div>
              <Button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                variant="outline"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-t border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  )
}
