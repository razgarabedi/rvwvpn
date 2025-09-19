"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Cog, Database, Shield, Network, Settings, Key } from "lucide-react"
import SystemSettings from "@/components/system-settings"

type ConfigSection = "overview" | "system" | "database" | "security" | "network" | "api" | "backup"

export default function ConfigTab() {
  const [activeSection, setActiveSection] = useState<ConfigSection>("overview")

  const configSections = [
    {
      id: "overview" as ConfigSection,
      title: "Configuration Overview",
      description: "View all configuration sections and system status",
      icon: Cog,
      status: "Active"
    },
    {
      id: "system" as ConfigSection,
      title: "System Settings",
      description: "Configure logging levels, performance tuning, and system limits",
      icon: Settings,
      status: "Active"
    },
    {
      id: "database" as ConfigSection,
      title: "Database Configuration",
      description: "Configure database connections and connection pooling settings",
      icon: Database,
      status: "Coming Soon"
    },
    {
      id: "security" as ConfigSection,
      title: "Security Settings",
      description: "Configure authentication methods, encryption, and security policies",
      icon: Shield,
      status: "Coming Soon"
    },
    {
      id: "network" as ConfigSection,
      title: "Network Settings",
      description: "Configure network interfaces, ports, and firewall rules",
      icon: Network,
      status: "Coming Soon"
    },
    {
      id: "api" as ConfigSection,
      title: "API Configuration",
      description: "Configure API endpoints, rate limiting, and authentication tokens",
      icon: Key,
      status: "Coming Soon"
    },
    {
      id: "backup" as ConfigSection,
      title: "Backup & Recovery",
      description: "Configure automated backups and disaster recovery settings",
      icon: Cog,
      status: "Coming Soon"
    }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case "system":
        return <SystemSettings />
      case "database":
        return (
          <Card className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Configuration</h3>
                <p className="text-gray-600">Database configuration coming soon...</p>
              </div>
            </div>
          </Card>
        )
      case "security":
        return (
          <Card className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Settings</h3>
                <p className="text-gray-600">Security configuration coming soon...</p>
              </div>
            </div>
          </Card>
        )
      case "network":
        return (
          <Card className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Network Settings</h3>
                <p className="text-gray-600">Network configuration coming soon...</p>
              </div>
            </div>
          </Card>
        )
      case "api":
        return (
          <Card className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">API Configuration</h3>
                <p className="text-gray-600">API configuration coming soon...</p>
              </div>
            </div>
          </Card>
        )
      case "backup":
        return (
          <Card className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Cog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup & Recovery</h3>
                <p className="text-gray-600">Backup configuration coming soon...</p>
              </div>
            </div>
          </Card>
        )
      default:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Cog className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Configuration Overview</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Configure system settings, security policies, and advanced RADIUS server options.
              </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configSections.map((section) => {
                const Icon = section.icon
                return (
                  <Card 
                    key={section.id} 
                    className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {section.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {section.description}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          section.status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
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
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cog className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Configure system settings, security policies, and advanced RADIUS server options.
        </p>
        
        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2">
          {configSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.title}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
