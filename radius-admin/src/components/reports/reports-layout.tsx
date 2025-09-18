"use client"

import { useState, useEffect } from "react"
import OnlineUsersReport from "./online-users"
import ConnectionAttemptsReport from "./connection-attempts"
import SearchUsersReport from "./search-users"
import TopUsersReport from "./top-users"
import LogsLayout from "./logs-layout"
import StatusLayout from "./status-layout"

type ReportTabType = "online-users" | "connection-attempts" | "search-users" | "top-users" | "logs" | "status"
type LogTabType = "daloradius-log" | "radius-server-log" | "system-log" | "boot-log"
type StatusTabType = "server-status" | "radius-status"

export default function ReportsLayout() {
  const [activeTab, setActiveTab] = useState<ReportTabType>("online-users")
  const [activeLogTab, setActiveLogTab] = useState<LogTabType>("daloradius-log")
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTabType>("server-status")

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.substring(1)
        
        // Handle basic reporting tabs
        if (["online-users", "connection-attempts", "search-users", "top-users"].includes(hash)) {
          setActiveTab(hash as ReportTabType)
        }
        // Handle log tabs
        else if (["daloradius-log", "radius-server-log", "system-log", "boot-log"].includes(hash)) {
          setActiveTab("logs")
          setActiveLogTab(hash as LogTabType)
        }
        // Handle status tabs
        else if (["server-status", "radius-status"].includes(hash)) {
          setActiveTab("status")
          setActiveStatusTab(hash as StatusTabType)
        }
      }
    }

    // Check initial hash
    handleHashChange()

    // Listen for hash changes
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange)
      return () => window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

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
        return <LogsLayout activeTab={activeLogTab} />
      case "status":
        return <StatusLayout activeTab={activeStatusTab} />
      default:
        return <OnlineUsersReport />
    }
  }

  return (
    <div className="min-h-[600px]">
      {renderReportContent()}
    </div>
  )
}
