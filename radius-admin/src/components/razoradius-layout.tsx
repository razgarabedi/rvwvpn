"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Server, 
  Database, 
  UserCheck, 
  Wifi, 
  BarChart3, 
  CreditCard, 
  MapPin, 
  TrendingUp, 
  Settings, 
  HelpCircle,
  Search,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react"
import EnhancedUserManagement from "@/components/enhanced-user-management"
import GroupsManagement from "@/components/groups-management"
import NASManagement from "@/components/nas-management"
import ServerConfig from "@/components/server-config"
import UserSearch from "@/components/user-search"
import QuickAddUser from "@/components/quick-add-user"

type MainTabType = "management" | "reports" | "accounting" | "billing" | "gis" | "graphs" | "config" | "help"
type SubTabType = "users" | "search-users" | "batch-users" | "hotspots" | "nas" | "user-groups" | "profiles" | "huntgroups" | "attributes" | "realm-proxy" | "ip-pool" | "server-config"

export default function RazoRADIUSLayout() {
  const { data: session, status } = useSession()
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>("management")
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("users")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [groups, setGroups] = useState<{ name: string; checks: { id: number; groupname: string; attribute: string; op: string; value: string }[]; replies: { id: number; groupname: string; attribute: string; op: string; value: string }[] }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/radius/groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  // Handle quick add user submission
  const handleQuickAddSubmit = async (formData: { username: string; password: string; group: string }) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/radius/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      })

      if (response.ok) {
        // If group is selected, assign user to group
        if (formData.group) {
          await fetch("/api/radius/users/assign-group", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: formData.username,
              groupName: formData.group,
              priority: 1
            }),
          })
        }
        
        setIsQuickAddOpen(false)
        // Refresh the current view if it's user-related
        if (activeSubTab === "users" || activeSubTab === "search-users") {
          window.location.reload() // Simple refresh for now
        }
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Failed to create user")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch groups on component mount
  useEffect(() => {
    fetchGroups()
  }, [])

  const mainTabs = [
    { id: "management" as MainTabType, label: "Management", icon: Database },
    { id: "reports" as MainTabType, label: "Reports", icon: BarChart3 },
    { id: "accounting" as MainTabType, label: "Accounting", icon: CreditCard },
    { id: "billing" as MainTabType, label: "Billing", icon: CreditCard },
    { id: "gis" as MainTabType, label: "GIS", icon: MapPin },
    { id: "graphs" as MainTabType, label: "Graphs", icon: TrendingUp },
    { id: "config" as MainTabType, label: "Config", icon: Settings },
    { id: "help" as MainTabType, label: "Help", icon: HelpCircle }
  ]

  const managementSubTabs = [
    { id: "users" as SubTabType, label: "Users", icon: Users },
    { id: "search-users" as SubTabType, label: "Search Users", icon: Search },
    { id: "batch-users" as SubTabType, label: "Batch Users", icon: Users },
    { id: "hotspots" as SubTabType, label: "Hotspots", icon: Wifi },
    { id: "nas" as SubTabType, label: "Nas", icon: Server },
    { id: "user-groups" as SubTabType, label: "User-Groups", icon: UserCheck },
    { id: "profiles" as SubTabType, label: "Profiles", icon: User },
    { id: "huntgroups" as SubTabType, label: "HuntGroups", icon: UserCheck },
    { id: "attributes" as SubTabType, label: "Attributes", icon: Settings },
    { id: "realm-proxy" as SubTabType, label: "Realm/Proxy", icon: Server },
    { id: "ip-pool" as SubTabType, label: "IP-Pool", icon: Database },
    { id: "server-config" as SubTabType, label: "Server Config", icon: Settings }
  ]

  const sidebarOptions = [
    {
      title: "USERS MANAGEMENT",
      items: [
        { label: "New User", icon: Users, active: true },
        { label: "New User - Quick Add", icon: Users },
        { label: "List Users", icon: Users },
        { label: "Search Users", icon: Search }
      ]
    },
    {
      title: "SERVER MANAGEMENT",
      items: [
        { label: "Server Config", icon: Settings },
        { label: "NAS Devices", icon: Server },
        { label: "User Groups", icon: UserCheck }
      ]
    },
    {
      title: "EXTENDED CAPABILITIES",
      items: [
        { label: "Import Users", icon: Database }
      ]
    }
  ]

  const renderContent = () => {
    if (activeMainTab !== "management") {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {mainTabs.find(tab => tab.id === activeMainTab)?.label} Section
            </h3>
            <p className="text-gray-600">This section is coming soon...</p>
          </div>
        </div>
      )
    }

    switch (activeSubTab) {
      case "users":
        return <EnhancedUserManagement />
      case "search-users":
        return <UserSearch />
      case "user-groups":
        return <GroupsManagement />
      case "nas":
        return <NASManagement />
      case "server-config":
        return <ServerConfig />
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {managementSubTabs.find(tab => tab.id === activeSubTab)?.label} Section
              </h3>
              <p className="text-gray-600">This section is coming soon...</p>
            </div>
          </div>
        )
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">RR</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">RazoRADIUS</span>
                </div>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                {mainTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveMainTab(tab.id)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeMainTab === tab.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right side - Search and User */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search Users"
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-600">{session?.user?.email}</span>
                <Button
                  onClick={() => signOut({ callbackUrl: "/signin" })}
                  variant="ghost"
                  size="sm"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Secondary Navigation - Only show for Management */}
          {activeMainTab === "management" && (
            <div className="border-t border-gray-200">
              <div className="flex items-center space-x-8 py-3">
                {managementSubTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeSubTab === tab.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Management</h2>
              
              {sidebarOptions.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon
                      const handleClick = () => {
                        if (item.label === "Server Config") {
                          setActiveSubTab("server-config")
                        } else if (item.label === "NAS Devices") {
                          setActiveSubTab("nas")
                        } else if (item.label === "User Groups") {
                          setActiveSubTab("user-groups")
                        } else if (item.label === "List Users") {
                          setActiveSubTab("users")
                        } else if (item.label === "Search Users") {
                          setActiveSubTab("search-users")
                        } else if (item.label === "New User - Quick Add") {
                          setIsQuickAddOpen(true)
                        }
                      }
                      return (
                        <button
                          key={itemIndex}
                          onClick={handleClick}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            (item.label === "Server Config" && activeSubTab === "server-config") ||
                            (item.label === "NAS Devices" && activeSubTab === "nas") ||
                            (item.label === "User Groups" && activeSubTab === "user-groups") ||
                            (item.label === "List Users" && activeSubTab === "users") ||
                            (item.label === "Search Users" && activeSubTab === "search-users") ||
                            item.active
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </div>

      {/* Quick Add User Dialog */}
      <QuickAddUser
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={handleQuickAddSubmit}
        groups={groups}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
