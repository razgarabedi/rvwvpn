"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Server, Database, UserCheck, Wifi } from "lucide-react"
import UserManagement from "@/components/user-management"
import EnhancedUserManagement from "@/components/enhanced-user-management"
import GroupsManagement from "@/components/groups-management"
import NASManagement from "@/components/nas-management"
import ServerConfig from "@/components/server-config"

type TabType = "users" | "enhanced" | "groups" | "nas" | "server"

export default function Navigation() {
  const [activeTab, setActiveTab] = useState<TabType>("enhanced")

  const tabs = [
    {
      id: "enhanced" as TabType,
      label: "Complete Management",
      icon: Database,
      description: "All-in-one dashboard"
    },
    {
      id: "users" as TabType,
      label: "Users",
      icon: Users,
      description: "Basic user management"
    },
    {
      id: "groups" as TabType,
      label: "Groups",
      icon: UserCheck,
      description: "Group attributes & policies"
    },
    {
      id: "nas" as TabType,
      label: "NAS Devices",
      icon: Wifi,
      description: "Network Access Servers"
    },
    {
      id: "server" as TabType,
      label: "Server Config",
      icon: Server,
      description: "RADIUS server settings"
    }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "enhanced":
        return <EnhancedUserManagement />
      case "users":
        return <UserManagement />
      case "groups":
        return <GroupsManagement />
      case "nas":
        return <NASManagement />
      case "server":
        return <ServerConfig />
      default:
        return <EnhancedUserManagement />
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 h-auto p-4"
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs opacity-70">{tab.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
