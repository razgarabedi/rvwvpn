"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"

export default function Home() {
  const { data: session, status } = useSession()

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Radius Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your FreeRADIUS users and groups</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Logged in as: {session?.user?.email}
            </div>
            <Button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Navigation and Content */}
        <Navigation />
      </div>
    </div>
  )
}
