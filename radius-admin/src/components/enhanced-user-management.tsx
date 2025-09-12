"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Users, Server } from "lucide-react"

interface RadUser {
  id: number
  UserName: string
  Attribute: string
  op: string
  Value: string
}

interface RadGroupCheck {
  id: number
  GroupName: string
  Attribute: string
  op: string
  Value: string
}

interface RadGroupReply {
  id: number
  GroupName: string
  Attribute: string
  op: string
  Value: string
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
    group: "",
    sessionTimeout: "3600",
    idleTimeout: "1800"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'nas'>('users')

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
        // If creating a new user and group is selected, assign user to group
        if (!editingUser && formData.group) {
          await assignUserToGroup(formData.username, formData.group)
        }
        
        // Add user reply attributes
        await addUserReplyAttributes(formData.username, {
          sessionTimeout: formData.sessionTimeout,
          idleTimeout: formData.idleTimeout
        })

        await fetchUsers() // Refresh the list
        setIsDialogOpen(false)
        setEditingUser(null)
        setFormData({ username: "", password: "", group: "", sessionTimeout: "3600", idleTimeout: "1800" })
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

  // Add user reply attributes
  const addUserReplyAttributes = async (username: string, attributes: { sessionTimeout: string; idleTimeout: string }) => {
    try {
      const response = await fetch("/api/radius/users/reply-attributes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          attributes: [
            { attribute: "Session-Timeout", op: "=", value: attributes.sessionTimeout },
            { attribute: "Idle-Timeout", op: "=", value: attributes.idleTimeout }
          ]
        }),
      })

      if (!response.ok) {
        console.error("Failed to add user reply attributes")
      }
    } catch (error) {
      console.error("Error adding user reply attributes:", error)
    }
  }

  // Handle edit user
  const handleEdit = (user: RadUser) => {
    setEditingUser(user)
    setFormData({
      username: user.UserName,
      password: user.Value,
      group: "",
      sessionTimeout: "3600",
      idleTimeout: "1800"
    })
    setIsDialogOpen(true)
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
    setFormData({ username: "", password: "", group: "", sessionTimeout: "3600", idleTimeout: "1800" })
    setIsDialogOpen(true)
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
                      <TableCell className="font-medium">{user.UserName}</TableCell>
                      <TableCell>{user.Attribute}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.Value.length > 10 ? `${user.Value.substring(0, 10)}...` : user.Value}
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
                          <li key={i}>{check.Attribute} {check.op} {check.Value}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-medium text-sm text-gray-600">Reply Attributes:</h4>
                      <ul className="text-sm text-gray-500">
                        {group.replies.map((reply: RadGroupReply, i: number) => (
                          <li key={i}>{reply.Attribute} {reply.op} {reply.Value}</li>
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
                ? "Update the user's username and password."
                : "Create a new RADIUS user account with group assignment and attributes."
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
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              {!editingUser && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="group" className="text-right">
                      Group
                    </Label>
                    <Select value={formData.group} onValueChange={(value: string) => setFormData({ ...formData, group: value })}>
                      <SelectTrigger className="col-span-3">
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
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sessionTimeout" className="text-right">
                      Session Timeout
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={formData.sessionTimeout}
                      onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="idleTimeout" className="text-right">
                      Idle Timeout
                    </Label>
                    <Input
                      id="idleTimeout"
                      type="number"
                      value={formData.idleTimeout}
                      onChange={(e) => setFormData({ ...formData, idleTimeout: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </>
              )}
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
