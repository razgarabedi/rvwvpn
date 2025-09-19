"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, Wifi, Server, Database } from "lucide-react"
import UserManagement from "@/components/user-management"
import EnhancedUserManagement from "@/components/enhanced-user-management"
import GroupsManagement from "@/components/groups-management"
import NASManagement from "@/components/nas-management"
import ServerConfig from "@/components/server-config"

type ManagementTabType = "enhanced" | "users" | "groups" | "nas" | "server"

export default function ManagementTab() {
  const [activeSubTab, setActiveSubTab] = useState<ManagementTabType>("enhanced")

  const subTabs = [
    {
      id: "enhanced" as ManagementTabType,
      label: "Complete Management",
      icon: Database,
      description: "All-in-one dashboard"
    },
    {
      id: "users" as ManagementTabType,
      label: "Users",
      icon: Users,
      description: "Basic user management"
    },
    {
      id: "groups" as ManagementTabType,
      label: "Groups",
      icon: UserCheck,
      description: "Group attributes & policies"
    },
    {
      id: "nas" as ManagementTabType,
      label: "NAS Devices",
      icon: Wifi,
      description: "Network Access Servers"
    },
    {
      id: "server" as ManagementTabType,
      label: "Server Config",
      icon: Server,
      description: "RADIUS server settings"
    }
  ]

  const renderContent = () => {
    switch (activeSubTab) {
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
      {/* Management Sub-Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-2">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeSubTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveSubTab(tab.id)}
                className="flex items-center gap-2 h-auto p-3"
              >
                <Icon className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className="text-xs opacity-70">{tab.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Management Content */}
      {renderContent()}
    </div>
  )
}
