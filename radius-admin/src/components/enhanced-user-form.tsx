"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff, HelpCircle, X } from "lucide-react"

interface RadUser {
  id: number
  username: string
  attribute: string
  op: string
  value: string
}

interface RadGroupCheck {
  id: number
  groupname: string
  attribute: string
  op: string
  value: string
}

interface RadGroupReply {
  id: number
  groupname: string
  attribute: string
  op: string
  value: string
}

interface RadGroup {
  name: string
  checks: RadGroupCheck[]
  replies: RadGroupReply[]
}

interface EnhancedUserFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    username: string
    password: string
    authenticationType: string
    group: string
    passwordType: string
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    billingFirstName: string
    billingLastName: string
    billingEmail: string
    billingPhone: string
    billingAddress: string
    billingCity: string
    billingState: string
    billingZipCode: string
    billingCountry: string
    paymentMethod: string
    customAttributes: string
  }) => void
  editingUser?: RadUser
  groups: RadGroup[]
  isSubmitting: boolean
}

export default function EnhancedUserForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingUser, 
  groups, 
  isSubmitting 
}: EnhancedUserFormProps) {
  const [activeTab, setActiveTab] = useState<"account" | "user" | "billing" | "attributes">("account")
  const [showPassword, setShowPassword] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [formData, setFormData] = useState({
    // Account Info
    username: "",
    password: "",
    authenticationType: "username-password",
    group: "",
    passwordType: "NT-Password",
    
    // User Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    
    // Billing Info
    billingFirstName: "",
    billingLastName: "",
    billingEmail: "",
    billingPhone: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "",
    paymentMethod: "",
    
    // Attributes
    customAttributes: ""
  })

  // Initialize form data when editing user
  useEffect(() => {
    if (editingUser) {
      setFormData(prev => ({
        ...prev,
        username: editingUser.username || "",
        password: editingUser.value || ""
      }))
    } else {
      setFormData({
        username: "",
        password: "",
        authenticationType: "username-password",
        group: "",
        passwordType: "NT-Password",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        billingFirstName: "",
        billingLastName: "",
        billingEmail: "",
        billingPhone: "",
        billingAddress: "",
        billingCity: "",
        billingState: "",
        billingZipCode: "",
        billingCountry: "",
        paymentMethod: "",
        customAttributes: ""
      })
    }
    setIsInitialized(true)
  }, [editingUser])

  const tabs = [
    { id: "account" as const, label: "Account Info", description: "Basic account settings" },
    { id: "user" as const, label: "User Info", description: "Personal information" },
    { id: "billing" as const, label: "Billing Info", description: "Billing and payment" },
    { id: "attributes" as const, label: "Attributes", description: "Custom RADIUS attributes" }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      authenticationType: "username-password",
      group: "",
      passwordType: "NT-Password",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      billingFirstName: "",
      billingLastName: "",
      billingEmail: "",
      billingPhone: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingZipCode: "",
      billingCountry: "",
      paymentMethod: "",
      customAttributes: ""
    })
    setActiveTab("account")
    setShowPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isInitialized) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2">Loading...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-xl font-semibold">
                {editingUser ? "Edit User" : "New User"}
              </DialogTitle>
              <HelpCircle className="h-4 w-4 text-gray-400" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {editingUser 
              ? "Update the user&apos;s account information and settings."
              : "Create a new RADIUS user account with comprehensive settings."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {/* Account Info Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                {/* Common Parameters */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Common parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="authenticationType">Authentication Type</Label>
                      <Select 
                        value={formData.authenticationType} 
                        onValueChange={(value) => setFormData({ ...formData, authenticationType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="username-password">Based on username and password</SelectItem>
                          <SelectItem value="certificate">Based on certificate</SelectItem>
                          <SelectItem value="mac-address">Based on MAC address</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="group">Group</Label>
                      <Select 
                        value={formData.group} 
                        onValueChange={(value) => setFormData({ ...formData, group: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.name} value={group.name}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        The user will be added to the specified group. By adding a user to a specific group they are subject to the group&apos;s attributes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Username/Password Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Username/password info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="The exact username the user will use to connect to the system"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Some systems use case-sensitive passwords. Take extra care!"
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-8 top-0 h-full px-2 py-2 hover:bg-transparent"
                          onClick={() => setFormData({ ...formData, password: "" })}
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="passwordType">Password Type</Label>
                      <Select 
                        value={formData.passwordType} 
                        onValueChange={(value) => setFormData({ ...formData, passwordType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NT-Password">NT-Password</SelectItem>
                          <SelectItem value="User-Password">User-Password</SelectItem>
                          <SelectItem value="Cleartext-Password">Cleartext-Password</SelectItem>
                          <SelectItem value="Crypt-Password">Crypt-Password</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Info Tab */}
            {activeTab === "user" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Billing Info Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingFirstName">Billing First Name</Label>
                    <Input
                      id="billingFirstName"
                      value={formData.billingFirstName}
                      onChange={(e) => setFormData({ ...formData, billingFirstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingLastName">Billing Last Name</Label>
                    <Input
                      id="billingLastName"
                      value={formData.billingLastName}
                      onChange={(e) => setFormData({ ...formData, billingLastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingEmail">Billing Email</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      value={formData.billingEmail}
                      onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingPhone">Billing Phone</Label>
                    <Input
                      id="billingPhone"
                      value={formData.billingPhone}
                      onChange={(e) => setFormData({ ...formData, billingPhone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Input
                      id="billingAddress"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCity">Billing City</Label>
                    <Input
                      id="billingCity"
                      value={formData.billingCity}
                      onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingState">Billing State</Label>
                    <Input
                      id="billingState"
                      value={formData.billingState}
                      onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingZipCode">Billing ZIP Code</Label>
                    <Input
                      id="billingZipCode"
                      value={formData.billingZipCode}
                      onChange={(e) => setFormData({ ...formData, billingZipCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCountry">Billing Country</Label>
                    <Input
                      id="billingCountry"
                      value={formData.billingCountry}
                      onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit-card">Credit Card</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Attributes Tab */}
            {activeTab === "attributes" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custom RADIUS Attributes</h3>
                <div>
                  <Label htmlFor="customAttributes">Custom Attributes</Label>
                  <Textarea
                    id="customAttributes"
                    value={formData.customAttributes}
                    onChange={(e) => setFormData({ ...formData, customAttributes: e.target.value })}
                    placeholder="Enter custom RADIUS attributes in the format:&#10;Attribute-Name = value&#10;Another-Attribute = another-value"
                    rows={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter custom RADIUS attributes one per line in the format: Attribute-Name = value
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingUser ? "Update User" : "Apply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
