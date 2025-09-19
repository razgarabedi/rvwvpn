"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Users, Server, Eye, EyeOff } from "lucide-react"

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

interface NASDevice {
  id: number
  nasname: string
  shortname: string
  type: string
  ports: number | null
  secret: string
  server: string | null
  community: string | null
  description: string | null
}

export default function EnhancedUserManagement() {
  const [users, setUsers] = useState<RadUser[]>([])
  const [groups, setGroups] = useState<RadGroup[]>([])
  const [nasDevices, setNasDevices] = useState<NASDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<RadUser | null>(null)
  const [formData, setFormData] = useState({ 
    username: "", 
    password: "", 
    group: ""
  })
  const [selectedGroup, setSelectedGroup] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'nas'>('users')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({})

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/radius/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        console.error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  // Fetch groups from API
  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/radius/groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      } else {
        console.error("Failed to fetch groups")
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  // Fetch NAS devices from API
  const fetchNASDevices = async () => {
    try {
      const response = await fetch("/api/radius/nas")
      if (response.ok) {
        const data = await response.json()
        setNasDevices(data)
      } else {
        console.error("Failed to fetch NAS devices")
      }
    } catch (error) {
      console.error("Error fetching NAS devices:", error)
    }
  }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([
        fetchUsers(),
        fetchGroups(),
        fetchNASDevices()
      ])
      setLoading(false)
    }
    fetchAll()
  }, [])


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingUser 
        ? `/api/radius/users/${editingUser.id}`
        : "/api/radius/users"
      
      const method = editingUser ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      })

      if (response.ok) {
        // Handle group assignment/update
        if (editingUser) {
          // For existing users, update group assignment
          if (formData.group && formData.group !== "none") {
            await updateUserGroup(formData.username, formData.group)
          } else {
            // Remove user from all groups if no group selected
            await updateUserGroup(formData.username, "")
          }
        } else {
          // For new users, assign to group if selected
          if (formData.group && formData.group !== "none") {
            await assignUserToGroup(formData.username, formData.group)
          }
        }

        await fetchUsers() // Refresh the list
        setIsDialogOpen(false)
        setEditingUser(null)
        setFormData({ username: "", password: "", group: "none" })
        setSelectedGroup("none")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save user")
      }
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Failed to save user")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Assign user to group
  const assignUserToGroup = async (username: string, groupName: string) => {
    try {
      const response = await fetch("/api/radius/users/assign-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          groupName,
          priority: 1
        }),
      })

      if (!response.ok) {
        console.error("Failed to assign user to group")
      }
    } catch (error) {
      console.error("Error assigning user to group:", error)
    }
  }

  // Update user group assignment
  const updateUserGroup = async (username: string, groupName: string) => {
    try {
      const response = await fetch(`/api/radius/users/${encodeURIComponent(username)}/groups`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName
        }),
      })

      if (!response.ok) {
        console.error("Failed to update user group")
      }
    } catch (error) {
      console.error("Error updating user group:", error)
    }
  }


  // Handle edit user
  const handleEdit = async (user: RadUser) => {
    setEditingUser(user)
    
    // Set initial form data first
    setFormData({
      username: user.username,
      password: user.value,
      group: "none"
    })
    setSelectedGroup("none")
    
    // Open dialog immediately
    setIsDialogOpen(true)
    
    // Fetch user's current group assignments
    try {
      const response = await fetch(`/api/radius/users/${encodeURIComponent(user.username)}/groups`)
      let currentGroup = ""
      
      if (response.ok) {
        const userGroups = await response.json()
        // Get the first group (highest priority) if user has groups
        if (userGroups && userGroups.length > 0) {
          currentGroup = userGroups[0].groupname
        }
      }
      
      // Update form data with the fetched group
      const groupValue = currentGroup || "none"
      setFormData(prev => ({
        ...prev,
        group: groupValue
      }))
      setSelectedGroup(groupValue)
    } catch (error) {
      console.error("Error fetching user details:", error)
    }
  }

  // Handle delete user
  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      const response = await fetch(`/api/radius/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchUsers() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user")
    }
  }

  // Handle add new user
  const handleAddNew = () => {
    setEditingUser(null)
    setFormData({ username: "", password: "", group: "none" })
    setSelectedGroup("none")
    setShowPassword(false)
    setIsDialogOpen(true)
  }

  // Toggle password visibility for table
  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
        <Button
          variant={activeTab === 'groups' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('groups')}
        >
          <Users className="h-4 w-4 mr-2" />
          Groups
        </Button>
        <Button
          variant={activeTab === 'nas' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('nas')}
        >
          <Server className="h-4 w-4 mr-2" />
          NAS Devices
        </Button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>RADIUS Users</CardTitle>
                <CardDescription>
                  Manage FreeRADIUS user accounts, passwords, and group assignments
                </CardDescription>
              </div>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found. Click &quot;Add New User&quot; to create your first user.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Attribute</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.attribute}</TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span>
                            {showPasswords[user.id] 
                              ? user.value 
                              : "••••••••••"
                            }
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => togglePasswordVisibility(user.id)}
                          >
                            {showPasswords[user.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <Card>
          <CardHeader>
            <CardTitle>RADIUS Groups</CardTitle>
            <CardDescription>
              Manage FreeRADIUS user groups and their attributes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No groups found.
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <div className="mt-2">
                      <h4 className="font-medium text-sm text-gray-600">Check Attributes:</h4>
                      <ul className="text-sm text-gray-500">
                        {group.checks.map((check: RadGroupCheck, i: number) => (
                          <li key={i}>{check.attribute} {check.op} {check.value}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-medium text-sm text-gray-600">Reply Attributes:</h4>
                      <ul className="text-sm text-gray-500">
                        {group.replies.map((reply: RadGroupReply, i: number) => (
                          <li key={i}>{reply.attribute} {reply.op} {reply.value}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* NAS Devices Tab */}
      {activeTab === 'nas' && (
        <Card>
          <CardHeader>
            <CardTitle>NAS Devices</CardTitle>
            <CardDescription>
              Manage Network Access Server devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nasDevices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No NAS devices found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAS Name</TableHead>
                    <TableHead>Short Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Secret</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nasDevices.map((nas) => (
                    <TableRow key={nas.id}>
                      <TableCell className="font-medium">{nas.nasname}</TableCell>
                      <TableCell>{nas.shortname}</TableCell>
                      <TableCell>{nas.type}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {nas.secret.length > 10 ? `${nas.secret.substring(0, 10)}...` : nas.secret}
                      </TableCell>
                      <TableCell>{nas.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? "Update the user's username, password, and group assignment."
                : "Create a new RADIUS user account with optional group assignment."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="group" className="text-right">
                  Group
                </Label>
                <Select 
                  value={selectedGroup} 
                  onValueChange={(value: string) => {
                    setSelectedGroup(value)
                    setFormData({ ...formData, group: value })
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.name} value={group.name}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
