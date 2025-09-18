"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Users, Download, Upload } from "lucide-react"
import UsersGraphs from "./users-graphs"
import ServerWideGraphs from "./server-wide-graphs"

export default function GraphsLayout() {
  const [activeTab, setActiveTab] = useState("users")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Handle hash-based navigation
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        setActiveTab(hash)
      }
    }

    // Set initial tab from hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const renderGraphsContent = () => {
    switch (activeTab) {
      case "users":
        return <UsersGraphs />
      case "server-wide":
        return <ServerWideGraphs />
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Graph Not Found
              </h3>
              <p className="text-gray-600">The requested graph is not available.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Graphs & Analytics</h1>
          <p className="text-gray-600">Visual representation of user connection data and statistics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Real-time</span>
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">2.4 TB</p>
            </div>
            <Download className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Uploads</p>
              <p className="text-2xl font-bold text-gray-900">1.8 TB</p>
            </div>
            <Upload className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Content */}
      {renderGraphsContent()}
    </div>
  )
}
