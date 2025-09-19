"use client"

import { Card } from "@/components/ui/card"
import { HelpCircle, Book, Video, MessageCircle, FileText, ExternalLink } from "lucide-react"

export default function HelpTab() {
  const helpSections = [
    {
      title: "User Guide",
      description: "Complete guide on how to use the RADIUS Admin Dashboard",
      icon: Book,
      status: "Available",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "API Documentation",
      description: "Comprehensive API documentation with examples and endpoints",
      icon: FileText,
      status: "Available",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video tutorials for common tasks",
      icon: Video,
      status: "Coming Soon"
    },
    {
      title: "FAQ",
      description: "Frequently asked questions and troubleshooting tips",
      icon: HelpCircle,
      status: "Available",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Community Support",
      description: "Get help from the community and share your experiences",
      icon: MessageCircle,
      status: "Coming Soon"
    },
    {
      title: "External Resources",
      description: "Links to FreeRADIUS documentation and external resources",
      icon: ExternalLink,
      status: "Available",
      color: "bg-green-50 text-green-600"
    }
  ]

  const quickLinks = [
    { title: "Getting Started", description: "Learn the basics of RADIUS administration" },
    { title: "User Management", description: "How to create and manage RADIUS users" },
    { title: "Group Configuration", description: "Setting up user groups and attributes" },
    { title: "NAS Device Setup", description: "Adding and configuring Network Access Servers" },
    { title: "Troubleshooting", description: "Common issues and their solutions" }
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Help & Support</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Find documentation, tutorials, and support resources to help you get the most out of your RADIUS Admin Dashboard.
        </p>
      </Card>

      {/* Quick Links */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link, index) => (
            <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-1">{link.title}</h4>
              <p className="text-sm text-gray-600">{link.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Help Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {helpSections.map((section, index) => {
          const Icon = section.icon
          return (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${section.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {section.description}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    section.status === "Available" 
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
