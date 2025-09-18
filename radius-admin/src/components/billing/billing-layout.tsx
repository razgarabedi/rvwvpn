"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CreditCard, 
  FileText, 
  DollarSign, 
  Receipt, 
  History, 
  Package, 
  Calculator,
  ShoppingCart,
  RefreshCw
} from "lucide-react"

// Import billing components
import POSManagement from "./pos-management"
import PlansManagement from "./plans-management"
import RatesManagement from "./rates-management"
import PayPalTransactions from "./paypal-transactions"
import BillingHistory from "./billing-history"
import InvoicesManagement from "./invoices-management"
import PaymentsManagement from "./payments-management"

type BillingTabType = 
  | "pos" 
  | "plans" 
  | "rates" 
  | "paypal" 
  | "history" 
  | "invoices" 
  | "payments"

export default function BillingLayout() {
  const [activeTab, setActiveTab] = useState<BillingTabType>("pos")
  const [mounted, setMounted] = useState(false)

  // Set mounted to true on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle hash-based navigation
  useEffect(() => {
    if (!mounted) return

    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      const validTabs: BillingTabType[] = ["pos", "plans", "rates", "paypal", "history", "invoices", "payments"]
      
      if (validTabs.includes(hash as BillingTabType)) {
        setActiveTab(hash as BillingTabType)
      }
    }

    // Set initial tab from hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [mounted])

  const billingTabs = [
    { id: "pos" as BillingTabType, label: "POS", icon: ShoppingCart },
    { id: "plans" as BillingTabType, label: "Plans", icon: Package },
    { id: "rates" as BillingTabType, label: "Rates", icon: Calculator },
    { id: "paypal" as BillingTabType, label: "PayPal", icon: CreditCard },
    { id: "history" as BillingTabType, label: "History", icon: History },
    { id: "invoices" as BillingTabType, label: "Invoices", icon: FileText },
    { id: "payments" as BillingTabType, label: "Payments", icon: Receipt },
  ]

  const renderBillingContent = () => {
    switch (activeTab) {
      case "pos":
        return <POSManagement />
      case "plans":
        return <PlansManagement />
      case "rates":
        return <RatesManagement />
      case "paypal":
        return <PayPalTransactions />
      case "history":
        return <BillingHistory />
      case "invoices":
        return <InvoicesManagement />
      case "payments":
        return <PaymentsManagement />
      default:
        return <POSManagement />
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading billing system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Management</h1>
          <p className="text-muted-foreground">
            Manage POS, plans, rates, transactions, and billing operations
          </p>
        </div>
      </div>

      {/* Billing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">$24,580</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Invoices</p>
                <p className="text-2xl font-bold">47</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Operations
          </CardTitle>
          <CardDescription>
            Select a billing category to manage your financial operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BillingTabType)}>
            <TabsList className="grid w-full grid-cols-7">
              {billingTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            
            <div className="mt-6">
              {renderBillingContent()}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
