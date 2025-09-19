"use client"

import { Card } from "@/components/ui/card"
import { Cog, Database, Shield, Network, Settings, Key } from "lucide-react"

export default function ConfigTab() {
  const configSections = [
    {
      title: "Database Configuration",
      description: "Configure database connections and connection pooling settings",
      icon: Database,
      status: "Coming Soon"
    },
    {
      title: "Security Settings",
      description: "Configure authentication methods, encryption, and security policies",
      icon: Shield,
      status: "Coming Soon"
    },
    {
      title: "Network Settings",
      description: "Configure network interfaces, ports, and firewall rules",
      icon: Network,
      status: "Coming Soon"
    },
    {
      title: "System Settings",
      description: "Configure logging levels, performance tuning, and system limits",
      icon: Settings,
      status: "Coming Soon"
    },
    {
      title: "API Configuration",
      description: "Configure API endpoints, rate limiting, and authentication tokens",
      icon: Key,
      status: "Coming Soon"
    },
    {
      title: "Backup & Recovery",
      description: "Configure automated backups and disaster recovery settings",
      icon: Cog,
      status: "Coming Soon"
    }
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cog className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Configure system settings, security policies, and advanced RADIUS server options.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configSections.map((section, index) => {
          const Icon = section.icon
          return (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
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
