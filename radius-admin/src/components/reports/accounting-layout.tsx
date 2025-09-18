"use client"

import { useState, useEffect } from "react"
import UsernameAccounting from "./username-accounting"
import IPAccounting from "./ip-accounting"
import NASAccounting from "./nas-accounting"
import DateRangeAccounting from "./date-range-accounting"
import AllRecordsAccounting from "./all-records-accounting"
import ActiveRecordsAccounting from "./active-records-accounting"
import CustomQueryAccounting from "./custom-query-accounting"
import HotSpotsAccounting from "./hotspots-accounting"

type AccountingTabType = 
  | "username" 
  | "ip-address" 
  | "nas-ip" 
  | "date-range" 
  | "all-records" 
  | "active-records" 
  | "custom-query"
  | "hotspots"

export default function AccountingLayout() {
  const [activeTab, setActiveTab] = useState<AccountingTabType>("username")

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.substring(1) as AccountingTabType
        if (hash && ["username", "ip-address", "nas-ip", "date-range", "all-records", "active-records", "custom-query", "hotspots"].includes(hash)) {
          setActiveTab(hash)
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

  const renderAccountingContent = () => {
    switch (activeTab) {
      case "username":
        return <UsernameAccounting />
      case "ip-address":
        return <IPAccounting />
      case "nas-ip":
        return <NASAccounting />
      case "date-range":
        return <DateRangeAccounting />
      case "all-records":
        return <AllRecordsAccounting />
      case "active-records":
        return <ActiveRecordsAccounting />
      case "custom-query":
        return <CustomQueryAccounting />
      case "hotspots":
        return <HotSpotsAccounting />
      default:
        return <UsernameAccounting />
    }
  }

  return (
    <div className="min-h-[600px]">
      {renderAccountingContent()}
    </div>
  )
}
