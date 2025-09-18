"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, X, Zap } from "lucide-react"

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

interface QuickAddUserProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { username: string; password: string; group: string }) => void
  groups: RadGroup[]
  isSubmitting: boolean
}

export default function QuickAddUser({ 
  isOpen, 
  onClose, 
  onSubmit, 
  groups, 
  isSubmitting 
}: QuickAddUserProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    group: ""
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: "",
        password: "",
        group: ""
      })
      setShowPassword(false)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.username && formData.password) {
      onSubmit(formData)
    }
  }

  const handleClose = () => {
    setFormData({
      username: "",
      password: "",
      group: ""
    })
    setShowPassword(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                New User - Quick Add
              </DialogTitle>
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
            Quickly create a new RADIUS user with just the essential information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="pr-20"
                  required
                />
                <div className="absolute right-0 top-0 h-full flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-full px-2 hover:bg-transparent"
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
                    className="h-full px-2 hover:bg-transparent"
                    onClick={() => setFormData({ ...formData, password: "" })}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Group */}
            <div className="space-y-2">
              <Label htmlFor="group">Group (Optional)</Label>
              <Select 
                value={formData.group} 
                onValueChange={(value) => setFormData({ ...formData, group: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.name} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Leave empty to create user without group assignment
              </p>
            </div>

            {/* Quick Add Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Quick Add Mode</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This creates a basic user account with default settings. 
                    You can edit advanced settings later from the user management section.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.username || !formData.password}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isSubmitting ? "Creating..." : "Quick Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
